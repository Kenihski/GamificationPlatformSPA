
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
    [Route("api/challenges")]
    public class ChallengesController : ControllerBase
    {
        private readonly IChallengeRepository _challengeRepository;
        private readonly IAttemptRepository _attemptRepository;
        private readonly IImageService _imageService;
        private readonly IAchievementService _achievementService;
        private readonly ILogger<ChallengesController> _logger;

        public ChallengesController(
            IChallengeRepository challengeRepository,
            IAttemptRepository attemptRepository,
            IImageService imageService,
            IAchievementService achievementService,
            ILogger<ChallengesController> logger)
        {
            _challengeRepository = challengeRepository;
            _attemptRepository = attemptRepository;
            _imageService = imageService;
            _achievementService = achievementService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<ChallengeDTO>>> GetChallenges(
            [FromQuery] string filter = "All",
            [FromQuery] string? searchTerm = null)
        {
            if (filter != "All" &&
                filter != "Core" &&
                filter != "Community")
            {
                return BadRequest(
                    "Filter must be All, Core or Community.");
            }

            var challenges =
                await _challengeRepository.SearchPublishedChallengesAsync(
                    filter, searchTerm);

            var challengeDTOs = challenges
                .Select(MapToDTO)
                .ToList();

            return Ok(challengeDTOs);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ChallengeDTO>> GetChallenge(int id)
        {
            var challenge =
                await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!challenge.IsPublished &&
                !CanManageChallenge(challenge))
            {
                return NotFound();
            }

            return Ok(MapToDTO(challenge));
        }

        // Returns the signed-in user's completed attempts for a challenge.
        [HttpGet("{id:int}/attempts")]
        [Authorize]
        public async Task<IActionResult> GetChallengeAttempts(int id)
        {
            if (!TryGetCurrentUserId(out int userId))
                return Unauthorized();

            var challenge = await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
                return NotFound();

            if (!challenge.IsPublished && !CanManageChallenge(challenge))
                return NotFound();

            var attempts =
                await _attemptRepository.GetCompletedAttemptsAsync(userId, id);

            var chronological = attempts
                .OrderBy(a => a.CompletedAt)
                .ThenBy(a => a.ChallengeAttemptId)
                .ToList();

            var latest = chronological.LastOrDefault();

            var best = attempts
                .OrderByDescending(a => a.Score)
                .ThenByDescending(a => a.CompletedAt)
                .ThenByDescending(a => a.ChallengeAttemptId)
                .FirstOrDefault();

            var attemptNumbers = chronological
                .Select((attempt, index) => new
                {
                    attempt.ChallengeAttemptId,
                    Number = index + 1
                })
                .ToDictionary(
                    x => x.ChallengeAttemptId,
                    x => x.Number);

            var history = attempts
                .OrderByDescending(a =>
                    a.ChallengeAttemptId == best!.ChallengeAttemptId)
                .ThenByDescending(a => a.CompletedAt)
                .Select(a => new
                {
                    a.ChallengeAttemptId,
                    AttemptNumber = attemptNumbers[a.ChallengeAttemptId],
                    a.Score,
                    a.StartedAt,
                    a.CompletedAt,
                    TimeUsedSeconds = a.CompletedAt.HasValue
                        ? Math.Max(
                            0,
                            (int)Math.Round(
                                (a.CompletedAt.Value - a.StartedAt)
                                .TotalSeconds))
                        : 0,
                    IsBest = a.ChallengeAttemptId ==
                        best!.ChallengeAttemptId,
                    IsLatest = a.ChallengeAttemptId ==
                        latest!.ChallengeAttemptId
                })
                .ToList();

            return Ok(new
            {
                ChallengeId = id,
                MaxPoints =
                    (await _challengeRepository
                        .GetChallengeWithQuestionsAsync(id))?
                        .Questions.Sum(q => q.Points) ?? 0,
                Attempts = history
            });
        }

        [HttpGet("mine")]
        [Authorize]
        public async Task<ActionResult<List<ChallengeDTO>>> GetMyChallenges()
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var challenges =
                await _challengeRepository.GetChallengesByUserIdAsync(userId);

            return Ok(challenges.Select(MapToDTO).ToList());
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ChallengeDTO>> CreateChallenge(
            [FromBody] ChallengeSaveDTO dto)
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            // Users may select default images or their own uploads.
            if (!await _imageService.IsAllowedImageAsync(
                dto.ImageUrl, userId))
            {
                ModelState.AddModelError(
                    nameof(dto.ImageUrl),
                    "This image is not available to you.");

                return ValidationProblem(ModelState);
            }

            var challenge = new Challenge
            {
                Title = dto.Title,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                TimeLimitMinutes = dto.TimeLimitMinutes,
                ShowAnswersAfterCompletion =
                    dto.ShowAnswersAfterCompletion,
                CreatedByUserId = userId,
                IsPublished = false,
                IsCore = false,
                MaxPoints = 0
            };

            var created =
                await _challengeRepository.CreateChallengeAsync(challenge);

            if (!created)
            {
                return StatusCode(500, "Could not create challenge.");
            }

            // Check creator achievements after saving the challenge.
            await _achievementService.CheckAchievementsAsync(userId);

            _logger.LogInformation(
                "User {UserId} created challenge {ChallengeId}.",
                userId,
                challenge.ChallengeId);

            return CreatedAtAction(
                nameof(GetChallenge),
                new { id = challenge.ChallengeId },
                MapToDTO(challenge));
        }

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateChallenge(
            int id,
            [FromBody] ChallengeSaveDTO dto)
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var challenge =
                await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!CanManageChallenge(challenge))
            {
                return Forbid();
            }

            // Admins may retain an existing image owned by another user.
            bool keepingExistingImage =
                dto.ImageUrl == challenge.ImageUrl;

            if (!keepingExistingImage &&
                !await _imageService.IsAllowedImageAsync(
                    dto.ImageUrl, userId))
            {
                ModelState.AddModelError(
                    nameof(dto.ImageUrl),
                    "This image is not available to you.");

                return ValidationProblem(ModelState);
            }

            // Only editable metadata is changed.
            challenge.Title = dto.Title;
            challenge.Description = dto.Description;
            challenge.ImageUrl = dto.ImageUrl;
            challenge.TimeLimitMinutes = dto.TimeLimitMinutes;
            challenge.ShowAnswersAfterCompletion =
                dto.ShowAnswersAfterCompletion;

            var updated =
                await _challengeRepository.UpdateChallengeAsync(challenge);

            if (!updated)
            {
                return StatusCode(500, "Could not update challenge.");
            }

            _logger.LogInformation(
                "User {UserId} updated challenge {ChallengeId}.",
                userId,
                id);

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteChallenge(int id)
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var challenge =
                await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!CanManageChallenge(challenge))
            {
                return Forbid();
            }

            var deleted =
                await _challengeRepository.DeleteChallengeAsync(challenge);

            if (!deleted)
            {
                return StatusCode(500, "Could not delete challenge.");
            }

            _logger.LogInformation(
                "User {UserId} deleted challenge {ChallengeId}.",
                userId,
                id);

            return NoContent();
        }

        [HttpPost("{id:int}/publish")]
        [Authorize]
        public async Task<IActionResult> PublishChallenge(int id)
        {
            var challenge = await _challengeRepository
                .GetChallengeWithQuestionsAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!CanManageChallenge(challenge))
            {
                return Forbid();
            }

            if (!challenge.Questions.Any())
            {
                return BadRequest(
                    "The challenge must have at least one question before it can be published.");
            }

            if (challenge.IsPublished)
            {
                return NoContent();
            }

            challenge.IsPublished = true;

            await _challengeRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Challenge {ChallengeId} was published by user {UserId}.",
                id,
                GetCurrentUserId());

            return NoContent();
        }

        [HttpPost("{id:int}/unpublish")]
        [Authorize]
        public async Task<IActionResult> UnpublishChallenge(int id)
        {
            var challenge =
                await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!CanManageChallenge(challenge))
            {
                return Forbid();
            }

            if (!challenge.IsPublished)
            {
                return NoContent();
            }

            challenge.IsPublished = false;

            await _challengeRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Challenge {ChallengeId} was unpublished by user {UserId}.",
                id,
                GetCurrentUserId());

            return NoContent();
        }

        [HttpPost("{id:int}/make-core")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MakeCore(int id)
        {
            var challenge =
                await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (challenge.IsCore)
            {
                return NoContent();
            }

            challenge.IsCore = true;

            await _challengeRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Challenge {ChallengeId} was marked as Core.",
                id);

            return NoContent();
        }

        [HttpPost("{id:int}/make-community")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MakeCommunity(int id)
        {
            var challenge =
                await _challengeRepository.GetChallengeByIdAsync(id);

            if (challenge == null)
            {
                return NotFound();
            }

            if (!challenge.IsCore)
            {
                return NoContent();
            }

            challenge.IsCore = false;

            await _challengeRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Challenge {ChallengeId} was marked as Community.",
                id);

            return NoContent();
        }

        private bool CanManageChallenge(Challenge challenge)
        {
            if (User.IsInRole("Admin"))
            {
                return true;
            }

            return TryGetCurrentUserId(out int userId) &&
                challenge.CreatedByUserId == userId;
        }

        private int? GetCurrentUserId()
        {
            return TryGetCurrentUserId(out int userId)
                ? userId
                : null;
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userIdValue, out userId);
        }

        private static ChallengeDTO MapToDTO(Challenge challenge)
        {
            return new ChallengeDTO
            {
                ChallengeId = challenge.ChallengeId,
                Title = challenge.Title,
                Description = challenge.Description,
                ImageUrl = challenge.ImageUrl,
                IsPublished = challenge.IsPublished,
                IsCore = challenge.IsCore,
                TimeLimitMinutes = challenge.TimeLimitMinutes,
                ShowAnswersAfterCompletion = challenge.ShowAnswersAfterCompletion,
                MaxPoints = challenge.MaxPoints,
                QuestionCount = challenge.Questions?.Count ?? 0,
                CreatedByUserId = challenge.CreatedByUserId
            };
        }
    }
}
