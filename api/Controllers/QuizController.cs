using System.Security.Claims;
using GamificationPlatform.DAL;
using GamificationPlatform.Models;
using GamificationPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/quiz")]
    public class QuizController : ControllerBase
    {
        private readonly IChallengeRepository _challengeRepository;
        private readonly IAttemptRepository _attemptRepository;
        private readonly IAchievementService _achievementService;
        private readonly ILogger<QuizController> _logger;

        public QuizController(
            IChallengeRepository challengeRepository,
            IAttemptRepository attemptRepository,
            IAchievementService achievementService,
            ILogger<QuizController> logger)
        {
            _challengeRepository = challengeRepository;
            _attemptRepository = attemptRepository;
            _achievementService = achievementService;
            _logger = logger;
        }

        // Starts or resumes an unfinished attempt without exposing correct answers.
        [HttpPost("challenges/{challengeId:int}/start")]
        public async Task<IActionResult> Start(int challengeId)
        {
            if (!TryGetCurrentUserId(out int userId))
                return Unauthorized();

            var challenge = await _challengeRepository
                .GetChallengeWithQuestionsAndOptionsAsync(challengeId);

            if (challenge == null)
                return NotFound();

            if (!CanTakeChallenge(challenge, userId))
                return Forbid();

            if (!challenge.Questions.Any())
                return BadRequest("The challenge must have at least one question.");

            var userChallenge = await _attemptRepository
                .GetUserChallengeAsync(userId, challengeId);

            if (userChallenge == null)
            {
                userChallenge = new UserChallenge
                {
                    UserId = userId,
                    ChallengeId = challengeId
                };

                if (!await _attemptRepository.CreateUserChallengeAsync(userChallenge))
                    return StatusCode(500, "Could not create user challenge.");
            }

            var attempt = await _attemptRepository
                .GetUnfinishedAttemptAsync(userChallenge.UserChallengeId);

            if (attempt == null)
            {
                attempt = new ChallengeAttempt
                {
                    UserChallengeId = userChallenge.UserChallengeId,
                    Score = 0,
                    Completed = false,
                    StartedAt = DateTime.Now
                };

                if (!await _attemptRepository.CreateAttemptAsync(attempt))
                    return StatusCode(500, "Could not start attempt.");

                _logger.LogInformation(
                    "User {UserId} started attempt {AttemptId} for challenge {ChallengeId}.",
                    userId, attempt.ChallengeAttemptId, challengeId);
            }

            return Ok(new
            {
                challenge.ChallengeId,
                challenge.Title,
                challenge.Description,
                challenge.TimeLimitMinutes,
                ChallengeAttemptId = attempt.ChallengeAttemptId,
                attempt.StartedAt,
                Questions = challenge.Questions.Select(q => new
                {
                    q.QuestionId,
                    q.Title,
                    q.Description,
                    q.QuestionType,
                    q.ImageUrl,
                    q.Points,
                    Options = q.QuestionType == "ShortAnswer"
                        ? Array.Empty<object>()
                        : q.Options.Select(o => (object)new
                        {
                            o.QuestionOptionId,
                            o.Text
                        }).ToArray()
                })
            });
        }

        [HttpPost("challenges/{challengeId:int}/submit")]
        public Task<IActionResult> Submit(int challengeId, [FromBody] QuizSubmissionRequest request)
        {
            return CompleteAttemptAsync(challengeId, request, false);
        }

        // Exit completes the attempt with whatever answers were submitted.
        [HttpPost("challenges/{challengeId:int}/exit")]
        public Task<IActionResult> Exit(int challengeId, [FromBody] QuizSubmissionRequest request)
        {
            return CompleteAttemptAsync(challengeId, request, true);
        }

        [HttpGet("attempts/{id:int}")]
        public async Task<IActionResult> AttemptDetails(int id)
        {
            if (!TryGetCurrentUserId(out int userId))
                return Unauthorized();

            var attempt = await _attemptRepository.GetAttemptDetailsAsync(id);

            if (attempt == null || !attempt.Completed)
                return NotFound();

            bool isAdmin = User.IsInRole("Admin");
            if (attempt.UserChallenge.UserId != userId && !isAdmin)
                return Forbid();

            var challenge = attempt.UserChallenge.Challenge;
            bool showAnswers = challenge.ShowAnswersAfterCompletion ||
                               challenge.CreatedByUserId == userId || isAdmin;

            return Ok(new
            {
                attempt.ChallengeAttemptId,
                challenge.ChallengeId,
                ChallengeTitle = challenge.Title,
                attempt.Score,
                MaxPoints = challenge.Questions.Sum(q => q.Points),
                attempt.StartedAt,
                attempt.CompletedAt,
                TimeUsedSeconds = attempt.CompletedAt.HasValue
                    ? Math.Max(0, (int)Math.Round(
                        (attempt.CompletedAt.Value - attempt.StartedAt).TotalSeconds))
                    : 0,
                ShowAnswers = showAnswers,
                Answers = attempt.Answers.Select(a =>
                {
                    var q = a.Question;
                    var selectedIds = a.SelectedOptions
                        .Select(o => o.QuestionOptionId).ToList();
                    bool correct = IsCorrect(q, selectedIds, a.TextAnswer);

                    return new
                    {
                        q.QuestionId,
                        QuestionTitle = q.Title,
                        QuestionDescription = q.Description,
                        q.QuestionType,
                        q.ImageUrl,
                        q.Points,
                        IsCorrect = correct,
                        PointsEarned = correct ? q.Points : 0,
                        Explanation = showAnswers ? q.Explanation : null,
                        SelectedOptionIds = showAnswers ? selectedIds : null,
                        TextAnswer = showAnswers ? a.TextAnswer : null,
                        CorrectAnswers = showAnswers
                            ? q.QuestionType == "ShortAnswer"
                                ? q.AcceptedAnswers.Select(x => x.Text).ToList()
                                : q.Options.Where(x => x.IsCorrect).Select(x => x.Text).ToList()
                            : null,
                        Options = showAnswers
                            ? q.Options.Select(o => new
                            {
                                o.QuestionOptionId,
                                o.Text,
                                o.IsCorrect,
                                IsSelected = selectedIds.Contains(o.QuestionOptionId)
                            }).ToList()
                            : null
                    };
                }).ToList()
            });
        }

        private async Task<IActionResult> CompleteAttemptAsync(
            int challengeId, QuizSubmissionRequest request, bool exited)
        {
            if (!TryGetCurrentUserId(out int userId))
                return Unauthorized();

            if (request == null || request.ChallengeAttemptId <= 0 || challengeId <= 0)
                return BadRequest("Invalid attempt submission.");

            var challenge = await _challengeRepository
                .GetChallengeWithQuestionsAndOptionsAsync(challengeId);

            if (challenge == null)
                return NotFound();

            if (!CanTakeChallenge(challenge, userId))
                return Forbid();

            if (!challenge.Questions.Any())
                return BadRequest("The challenge must contain at least one question.");

            var attempt = await _attemptRepository.GetValidUnfinishedAttemptAsync(
                request.ChallengeAttemptId, userId, challengeId);

            if (attempt == null)
                return NotFound("No valid unfinished attempt was found.");

            var answers = request.Answers ?? new Dictionary<int, List<int>>();
            var textAnswers = request.TextAnswers ?? new Dictionary<int, string>();

            if (!ValidateAnswers(challenge, answers, textAnswers, out string error))
                return BadRequest(error);

            // Enforce the time limit on the server, not in React.
            bool expired = challenge.TimeLimitMinutes.HasValue &&
                DateTime.Now > attempt.StartedAt
                    .AddMinutes(challenge.TimeLimitMinutes.Value).AddSeconds(5);

            if (expired)
            {
                answers.Clear();
                textAnswers.Clear();
            }

            int score = 0;
            foreach (var question in challenge.Questions)
            {
                var selectedIds = question.QuestionType == "ShortAnswer"
                    ? new List<int>()
                    : answers.TryGetValue(question.QuestionId, out var ids) && ids != null
                        ? ids.Distinct().ToList()
                        : new List<int>();

                string? textAnswer = null;
                if (question.QuestionType == "ShortAnswer" &&
                    textAnswers.TryGetValue(question.QuestionId, out var submittedText))
                {
                    textAnswer = string.IsNullOrWhiteSpace(submittedText)
                        ? null : submittedText.Trim();
                }

                if (IsCorrect(question, selectedIds, textAnswer))
                    score += question.Points;

                var attemptAnswer = new AttemptAnswer
                {
                    ChallengeAttemptId = attempt.ChallengeAttemptId,
                    QuestionId = question.QuestionId,
                    TextAnswer = textAnswer
                };

                foreach (int optionId in selectedIds)
                {
                    attemptAnswer.SelectedOptions.Add(new AttemptAnswerOption
                    {
                        QuestionOptionId = optionId
                    });
                }

                _attemptRepository.AddAttemptAnswer(attemptAnswer);
            }

            attempt.Score = score;
            attempt.Completed = true;
            attempt.CompletedAt = DateTime.Now;

            if (!await _attemptRepository.SaveChangesAsync())
                return StatusCode(500, "Could not save the attempt.");

            // The creator can also earn achievements when others complete their quiz.
            await _achievementService.CheckAchievementsForAllUsersAsync();

            _logger.LogInformation(
                "User {UserId} completed attempt {AttemptId} for challenge {ChallengeId} with score {Score}.",
                userId, attempt.ChallengeAttemptId, challengeId, score);

            bool showAnswers = challenge.ShowAnswersAfterCompletion ||
                               challenge.CreatedByUserId == userId ||
                               User.IsInRole("Admin");

            return Ok(new
            {
                challenge.ChallengeId,
                ChallengeTitle = challenge.Title,
                ChallengeAttemptId = attempt.ChallengeAttemptId,
                Score = score,
                MaxScore = challenge.Questions.Sum(q => q.Points),
                attempt.CompletedAt,
                TimeUsedSeconds = Math.Max(0, (int)Math.Round(
                    (attempt.CompletedAt.Value - attempt.StartedAt).TotalSeconds)),
                ShowAnswers = showAnswers,
                Exited = exited,
                TimedOut = expired,
                AttemptDetailsUrl = $"/api/quiz/attempts/{attempt.ChallengeAttemptId}"
            });
        }

        private bool CanTakeChallenge(Challenge challenge, int userId)
        {
            return challenge.IsPublished ||
                   challenge.CreatedByUserId == userId ||
                   User.IsInRole("Admin");
        }

        private static bool ValidateAnswers(
            Challenge challenge,
            Dictionary<int, List<int>> answers,
            Dictionary<int, string> textAnswers,
            out string error)
        {
            foreach (var (questionId, optionIds) in answers)
            {
                var question = challenge.Questions.FirstOrDefault(q => q.QuestionId == questionId);
                if (question == null || question.QuestionType == "ShortAnswer")
                {
                    error = "An answer does not belong to this challenge question.";
                    return false;
                }

                var uniqueIds = (optionIds ?? new List<int>()).Distinct().ToList();
                if (uniqueIds.Any(id => !question.Options.Any(o => o.QuestionOptionId == id)))
                {
                    error = "An option does not belong to this question.";
                    return false;
                }

                if (question.QuestionType == "SingleChoice" && uniqueIds.Count > 1)
                {
                    error = "A single choice question can only have one selected answer.";
                    return false;
                }
            }

            foreach (var (questionId, answer) in textAnswers)
            {
                var question = challenge.Questions.FirstOrDefault(q => q.QuestionId == questionId);
                if (question == null || question.QuestionType != "ShortAnswer")
                {
                    error = "A text answer does not belong to this challenge question.";
                    return false;
                }

                if (answer != null && answer.Length > 200)
                {
                    error = "A short answer cannot be longer than 200 characters.";
                    return false;
                }
            }

            error = string.Empty;
            return true;
        }

        private static bool IsCorrect(Question question, List<int> selectedIds, string? textAnswer)
        {
            if (question.QuestionType == "ShortAnswer")
            {
                if (string.IsNullOrWhiteSpace(textAnswer))
                    return false;

                string normalized = NormalizeShortAnswer(textAnswer);
                return question.AcceptedAnswers.Any(a =>
                    NormalizeShortAnswer(a.Text) == normalized);
            }

            var correctIds = question.Options.Where(o => o.IsCorrect)
                .Select(o => o.QuestionOptionId).OrderBy(id => id);

            return selectedIds.Count > 0 &&
                   selectedIds.OrderBy(id => id).SequenceEqual(correctIds);
        }

        private static string NormalizeShortAnswer(string answer)
        {
            return string.Join(" ", answer.Trim().ToLowerInvariant()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
        }
    }

    public class QuizSubmissionRequest
    {
        public int ChallengeAttemptId { get; set; }
        public Dictionary<int, List<int>> Answers { get; set; } = new();
        public Dictionary<int, string> TextAnswers { get; set; } = new();
    }
}
