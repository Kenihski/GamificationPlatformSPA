
using System.Security.Claims;
using GamificationPlatform.DAL;
using GamificationPlatform.DTOs;
using GamificationPlatform.Models;
using GamificationPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/challenges/{challengeId:int}/questions")]
    public class QuestionsController : ControllerBase
    {
        private readonly IChallengeRepository _challengeRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IAttemptRepository _attemptRepository;
        private readonly IImageService _imageService;
        private readonly ILogger<QuestionsController> _logger;

        public QuestionsController(
            IChallengeRepository challengeRepository,
            IQuestionRepository questionRepository,
            IAttemptRepository attemptRepository,
            IImageService imageService,
            ILogger<QuestionsController> logger)
        {
            _challengeRepository = challengeRepository;
            _questionRepository = questionRepository;
            _attemptRepository = attemptRepository;
            _imageService = imageService;
            _logger = logger;
        }

        // Returns all questions for the administration page.
        [HttpGet("/api/admin/questions")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<AdminQuestionDTO>>> GetAllQuestions()
        {
            var questions = await _questionRepository.GetAllQuestionsAsync();

            var result = questions.Select(question => new AdminQuestionDTO
            {
                QuestionId = question.QuestionId,
                ChallengeId = question.ChallengeId,
                Title = question.Title,
                Description = question.Description,
                Points = question.Points,
                ImageUrl = question.ImageUrl,
                ChallengeTitle = question.Challenge.Title,
                OwnerId = question.Challenge.CreatedByUserId,
                OwnerUsername = question.Challenge.CreatedByUser.UserName ?? ""
            }).ToList();

            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<List<QuestionDTO>>> GetQuestions(
            int challengeId)
        {
            var challenge = await GetManageableChallengeAsync(challengeId);

            if (challenge == null)
            {
                return NotFound();
            }

            var challengeWithQuestions = await _challengeRepository
                .GetChallengeWithQuestionsAndOptionsAsync(challengeId);

            if (challengeWithQuestions == null)
            {
                return NotFound();
            }

            return Ok(challengeWithQuestions.Questions
                .Select(MapToDTO)
                .ToList());
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<QuestionDTO>> GetQuestion(
            int challengeId,
            int id)
        {
            var challenge = await GetManageableChallengeAsync(challengeId);

            if (challenge == null)
            {
                return NotFound();
            }

            var question = await _questionRepository
                .GetQuestionWithOptionsAsync(id);

            if (question == null || question.ChallengeId != challengeId)
            {
                return NotFound();
            }

            return Ok(MapToDTO(question));
        }

        [HttpPost]
        public async Task<ActionResult<QuestionDTO>> CreateQuestion(
            int challengeId,
            [FromBody] QuestionSaveDTO dto)
        {
            var challenge = await GetManageableChallengeAsync(challengeId);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!ValidateAnswers(dto))
            {
                return ValidationProblem(ModelState);
            }

            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            // Users may select default images or their own uploads.
            if (!await _imageService.IsAllowedImageAsync(
                dto.ImageUrl, userId.Value))
            {
                ModelState.AddModelError(
                    nameof(dto.ImageUrl),
                    "This image is not available to you.");

                return ValidationProblem(ModelState);
            }

            var question = new Question
            {
                ChallengeId = challengeId
            };

            ApplyChanges(question, dto);

            // Changing quiz content resets previous attempts and scores.
            await _attemptRepository.DeleteChallengeHistoryAsync(challengeId);

            var created = await _questionRepository
                .CreateQuestionAsync(question);

            if (!created)
            {
                return StatusCode(500, "Could not create question.");
            }

            _logger.LogInformation(
                "User {UserId} created question {QuestionId} in challenge {ChallengeId}; previous attempts and scores were reset.",
                userId.Value,
                question.QuestionId,
                challengeId);

            return CreatedAtAction(
                nameof(GetQuestion),
                new { challengeId, id = question.QuestionId },
                MapToDTO(question));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateQuestion(
            int challengeId,
            int id,
            [FromBody] QuestionSaveDTO dto)
        {
            var challenge = await GetManageableChallengeAsync(challengeId);

            if (challenge == null)
            {
                return NotFound();
            }

            var question = await _questionRepository
                .GetQuestionWithOptionsAsync(id);

            if (question == null || question.ChallengeId != challengeId)
            {
                return NotFound();
            }

            if (!ValidateAnswers(dto))
            {
                return ValidationProblem(ModelState);
            }

            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            // Admins may retain an existing image owned by another user.
            bool keepingExistingImage =
                dto.ImageUrl == question.ImageUrl;

            if (!keepingExistingImage &&
                !await _imageService.IsAllowedImageAsync(
                    dto.ImageUrl, userId.Value))
            {
                ModelState.AddModelError(
                    nameof(dto.ImageUrl),
                    "This image is not available to you.");

                return ValidationProblem(ModelState);
            }

            // Changing quiz content resets previous attempts and scores.
            await _attemptRepository.DeleteChallengeHistoryAsync(challengeId);

            ApplyChanges(question, dto);

            var updated = await _questionRepository
                .UpdateQuestionAsync(question);

            if (!updated)
            {
                return StatusCode(500, "Could not update question.");
            }

            _logger.LogInformation(
                "User {UserId} updated question {QuestionId} in challenge {ChallengeId}; previous attempts and scores were reset.",
                userId.Value,
                id,
                challengeId);

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteQuestion(
            int challengeId,
            int id)
        {
            var challenge = await GetManageableChallengeAsync(challengeId);

            if (challenge == null)
            {
                return NotFound();
            }

            var challengeWithQuestions = await _challengeRepository
                .GetChallengeWithQuestionsAndOptionsAsync(challengeId);

            if (challengeWithQuestions == null)
            {
                return NotFound();
            }

            var question = challengeWithQuestions.Questions
                .FirstOrDefault(q => q.QuestionId == id);

            if (question == null)
            {
                return NotFound();
            }

            // A published challenge must contain at least one question.
            bool shouldUnpublish =
                challengeWithQuestions.IsPublished &&
                challengeWithQuestions.Questions.Count == 1;

            await _attemptRepository.DeleteChallengeHistoryAsync(challengeId);

            if (shouldUnpublish)
            {
                challengeWithQuestions.IsPublished = false;
            }

            var deleted = await _questionRepository
                .DeleteQuestionAsync(question);

            if (!deleted)
            {
                return StatusCode(500, "Could not delete question.");
            }

            _logger.LogInformation(
                "User {UserId} deleted question {QuestionId} in challenge {ChallengeId}; previous attempts and scores were reset.",
                GetCurrentUserId(),
                id,
                challengeId);

            if (shouldUnpublish)
            {
                _logger.LogInformation(
                    "Challenge {ChallengeId} was automatically unpublished after its last question was deleted.",
                    challengeId);
            }

            return NoContent();
        }

        private async Task<Challenge?> GetManageableChallengeAsync(
            int challengeId)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return null;
            }

            var challenge = await _challengeRepository
                .GetChallengeByIdAsync(challengeId);

            if (challenge == null)
            {
                return null;
            }

            // Admins can manage all challenges; other users only their own.
            if (!User.IsInRole("Admin") &&
                challenge.CreatedByUserId != userId.Value)
            {
                return null;
            }

            return challenge;
        }

        private int? GetCurrentUserId()
        {
            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userIdValue, out int userId)
                ? userId
                : null;
        }

        private bool ValidateAnswers(QuestionSaveDTO dto)
        {
            if (dto.QuestionType != "SingleChoice" &&
                dto.QuestionType != "MultipleChoice" &&
                dto.QuestionType != "ShortAnswer")
            {
                ModelState.AddModelError(
                    nameof(dto.QuestionType),
                    "Please select a valid question type.");

                return false;
            }

            if (dto.QuestionType == "ShortAnswer")
            {
                var answers = dto.AcceptedAnswers ?? new List<string>();

                var filledAnswers = answers
                    .Where(a => !string.IsNullOrWhiteSpace(a))
                    .Select(a => a.Trim())
                    .ToList();

                if (answers.Count > 4 || filledAnswers.Count == 0)
                {
                    ModelState.AddModelError(
                        nameof(dto.AcceptedAnswers),
                        "Enter between 1 and 4 accepted answers.");
                }

                if (filledAnswers.Any(a => a.Length > 200))
                {
                    ModelState.AddModelError(
                        nameof(dto.AcceptedAnswers),
                        "Each accepted answer must be at most 200 characters.");
                }

                if (filledAnswers
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count() != filledAnswers.Count)
                {
                    ModelState.AddModelError(
                        nameof(dto.AcceptedAnswers),
                        "Accepted answers must be different.");
                }

                if (dto.Options?.Count > 0)
                {
                    ModelState.AddModelError(
                        nameof(dto.Options),
                        "Short-answer questions cannot have answer options.");
                }
            }
            else
            {
                var options = dto.Options ?? new List<QuestionOptionSaveDTO>();

                var filledOptions = options
                    .Where(o => !string.IsNullOrWhiteSpace(o.Text))
                    .Select(o => o.Text.Trim())
                    .ToList();

                if (options.Count > 4 || filledOptions.Count < 2)
                {
                    ModelState.AddModelError(
                        nameof(dto.Options),
                        "Enter between 2 and 4 answer options.");
                }

                if (filledOptions.Any(o => o.Length > 200))
                {
                    ModelState.AddModelError(
                        nameof(dto.Options),
                        "Each answer option must be at most 200 characters.");
                }

                if (filledOptions
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Count() != filledOptions.Count)
                {
                    ModelState.AddModelError(
                        nameof(dto.Options),
                        "Answer options must be different.");
                }

                var correctCount = options.Count(o =>
                    o.IsCorrect && !string.IsNullOrWhiteSpace(o.Text));

                if (correctCount == 0)
                {
                    ModelState.AddModelError(
                        nameof(dto.Options),
                        "Select at least one correct answer.");
                }

                if (dto.QuestionType == "SingleChoice" &&
                    correctCount != 1)
                {
                    ModelState.AddModelError(
                        nameof(dto.Options),
                        "Single-choice questions must have exactly one correct answer.");
                }

                if (dto.AcceptedAnswers?.Count > 0)
                {
                    ModelState.AddModelError(
                        nameof(dto.AcceptedAnswers),
                        "Choice questions cannot have accepted text answers.");
                }
            }

            return ModelState.IsValid;
        }

        private static void ApplyChanges(
            Question question,
            QuestionSaveDTO dto)
        {
            question.Title = dto.Title;
            question.Description = dto.Description;
            question.Explanation = dto.Explanation;
            question.Points = dto.Points;
            question.ImageUrl = dto.ImageUrl ?? string.Empty;
            question.QuestionType = dto.QuestionType;

            // Replace the previous answers when editing a question.
            question.Options.Clear();
            question.AcceptedAnswers.Clear();

            if (dto.QuestionType == "ShortAnswer")
            {
                foreach (var answer in dto.AcceptedAnswers)
                {
                    if (string.IsNullOrWhiteSpace(answer))
                    {
                        continue;
                    }

                    question.AcceptedAnswers.Add(
                        new QuestionAcceptedAnswer
                        {
                            Text = answer.Trim(),
                            Question = question
                        });
                }
            }
            else
            {
                foreach (var option in dto.Options)
                {
                    if (string.IsNullOrWhiteSpace(option.Text))
                    {
                        continue;
                    }

                    question.Options.Add(
                        new QuestionOption
                        {
                            Text = option.Text.Trim(),
                            IsCorrect = option.IsCorrect,
                            Question = question
                        });
                }
            }
        }

        private static QuestionDTO MapToDTO(Question question)
        {
            return new QuestionDTO
            {
                QuestionId = question.QuestionId,
                ChallengeId = question.ChallengeId,
                Title = question.Title,
                Description = question.Description,
                Explanation = question.Explanation,
                Points = question.Points,
                ImageUrl = question.ImageUrl,
                QuestionType = question.QuestionType,
                Options = question.Options
                    .Select(o => new QuestionOptionDTO
                    {
                        QuestionOptionId = o.QuestionOptionId,
                        Text = o.Text,
                        IsCorrect = o.IsCorrect
                    })
                    .ToList(),
                AcceptedAnswers = question.AcceptedAnswers
                    .Select(a => a.Text)
                    .ToList()
            };
        }
    }
}
