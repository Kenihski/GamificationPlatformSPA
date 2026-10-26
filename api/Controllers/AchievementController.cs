using System.ComponentModel.DataAnnotations;
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
    [Route("api/achievements")]
    public class AchievementController : ControllerBase
    {
        private readonly IAchievementRepository _achievementRepository;
        private readonly IAchievementService _achievementService;
        private readonly ILogger<AchievementController> _logger;

        private static readonly HashSet<string> ValidTypes = new(StringComparer.Ordinal)
        {
            "ChallengesCompleted", "ScorePercentage", "SecondAttemptImprovement",
            "SameChallengeAttempts", "ChallengesCreated", "CreatorUniqueParticipants",
            "ChallengeLeaderboardPosition", "CoreLeaderboardPosition"
        };

        public AchievementController(
            IAchievementRepository achievementRepository,
            IAchievementService achievementService,
            ILogger<AchievementController> logger)
        {
            _achievementRepository = achievementRepository;
            _achievementService = achievementService;
            _logger = logger;
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            if (!TryGetUserId(out int userId)) return Unauthorized();
            if (User.IsInRole("Admin")) return Forbid();

            var achievements = (await _achievementRepository.GetActiveAsync())
                .OrderBy(GetCategoryOrder)
                .ThenBy(a => a.RequirementValue)
                .ThenBy(a => a.AchievementId)
                .ToList();

            var unlocked = (await _achievementRepository.GetUserAchievementsAsync(userId))
                .Where(ua => ua.Achievement.IsActive)
                .ToList();

            var unlockedById = unlocked.ToDictionary(ua => ua.AchievementId);
            int totalPoints = unlocked.Where(ua => !ua.Achievement.IsGoal)
                .Sum(ua => ua.Achievement.Points);
            int maxPoints = achievements.Where(a => !a.IsGoal).Sum(a => a.Points);
            var milestone = CalculateMilestone(totalPoints, maxPoints);

            return Ok(new
            {
                Username = User.Identity?.Name ?? "",
                TotalPoints = totalPoints,
                MaxPoints = maxPoints,
                UnlockedCount = unlocked.Count,
                TotalAchievements = achievements.Count,
                milestone.MilestoneName,
                milestone.MilestoneIcon,
                milestone.MilestoneMessage,
                milestone.CurrentMilestonePoints,
                milestone.NextMilestonePoints,
                milestone.ProgressPercent,
                Achievements = achievements.Select(a =>
                {
                    unlockedById.TryGetValue(a.AchievementId, out var userAchievement);
                    return new
                    {
                        a.AchievementId,
                        a.Name,
                        a.Description,
                        a.Points,
                        a.IsGoal,
                        IsUnlocked = userAchievement != null,
                        UnlockedAt = userAchievement?.UnlockedAt
                    };
                }).ToList()
            });
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllForAdmin()
        {
            var achievements = (await _achievementRepository.GetAllAsync())
                .OrderBy(GetCategoryOrder)
                .ThenBy(a => a.RequirementValue)
                .ThenBy(a => a.AchievementId)
                .Select(ToAdminResponse)
                .ToList();
            return Ok(achievements);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var achievement = await _achievementRepository.GetByIdAsync(id);
            return achievement == null ? NotFound() : Ok(ToAdminResponse(achievement));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] AchievementSaveRequest request)
        {
            ValidateRequest(request);
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var achievement = new Achievement
            {
                Name = request.Name,
                Description = request.Description,
                Points = request.Points,
                Type = request.Type,
                RequirementValue = request.RequirementValue,
                IsActive = request.IsActive,
                IsGoal = false
            };

            await _achievementRepository.AddAsync(achievement);
            await _achievementRepository.SaveChangesAsync();

            if (achievement.IsActive)
                await _achievementService.CheckAchievementsForAllUsersAsync();

            _logger.LogInformation("Achievement {AchievementId} created.", achievement.AchievementId);
            return CreatedAtAction(nameof(GetById), new { id = achievement.AchievementId },
                ToAdminResponse(achievement));
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] AchievementSaveRequest request)
        {
            var achievement = await _achievementRepository.GetByIdAsync(id);
            if (achievement == null) return NotFound();
            if (achievement.IsGoal) return BadRequest("System goals cannot be edited.");

            ValidateRequest(request);
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            achievement.Name = request.Name;
            achievement.Description = request.Description;
            achievement.Points = request.Points;
            achievement.Type = request.Type;
            achievement.RequirementValue = request.RequirementValue;
            // Publishing is handled by separate endpoints.
            _achievementRepository.Update(achievement);
            await _achievementRepository.SaveChangesAsync();

            if (achievement.IsActive)
                await _achievementService.CheckAchievementsForAllUsersAsync();

            _logger.LogInformation("Achievement {AchievementId} updated.", id);
            return Ok(ToAdminResponse(achievement));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var achievement = await _achievementRepository.GetByIdAsync(id);
            if (achievement == null) return NotFound();
            if (achievement.IsGoal) return BadRequest("System goals cannot be deleted.");

            _achievementRepository.Delete(achievement);
            await _achievementRepository.SaveChangesAsync();
            _logger.LogInformation("Achievement {AchievementId} deleted.", id);
            return NoContent();
        }

        [HttpPost("{id:int}/publish")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Publish(int id)
        {
            var achievement = await _achievementRepository.GetByIdAsync(id);
            if (achievement == null) return NotFound();
            if (achievement.IsGoal) return BadRequest("System goals cannot be changed.");
            if (achievement.IsActive) return NoContent();

            achievement.IsActive = true;
            _achievementRepository.Update(achievement);
            await _achievementRepository.SaveChangesAsync();
            await _achievementService.CheckAchievementsForAllUsersAsync();
            _logger.LogInformation("Achievement {AchievementId} published.", id);
            return NoContent();
        }

        [HttpPost("{id:int}/unpublish")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Unpublish(int id)
        {
            var achievement = await _achievementRepository.GetByIdAsync(id);
            if (achievement == null) return NotFound();
            if (achievement.IsGoal) return BadRequest("System goals cannot be changed.");
            if (!achievement.IsActive) return NoContent();

            achievement.IsActive = false;
            _achievementRepository.Update(achievement);
            await _achievementRepository.SaveChangesAsync();
            _logger.LogInformation("Achievement {AchievementId} unpublished.", id);
            return NoContent();
        }

        private void ValidateRequest(AchievementSaveRequest request)
        {
            if (!ValidTypes.Contains(request.Type))
                ModelState.AddModelError(nameof(request.Type), "Invalid achievement type.");
            if (request.Points is not (5 or 10 or 15 or 20))
                ModelState.AddModelError(nameof(request.Points), "AP must be 5, 10, 15 or 20.");
            if (request.RequirementValue <= 0)
                ModelState.AddModelError(nameof(request.RequirementValue), "Requirement must be greater than zero.");
            if (request.Type == "ScorePercentage" && request.RequirementValue > 100)
                ModelState.AddModelError(nameof(request.RequirementValue), "Percentage requirements cannot exceed 100.");
        }

        private bool TryGetUserId(out int userId) =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

        private static object ToAdminResponse(Achievement a) => new
        {
            a.AchievementId, a.Name, a.Description, a.Points, a.Type,
            a.RequirementValue, a.IsActive, a.IsGoal
        };

        private static int GetCategoryOrder(Achievement achievement)
        {
            if (achievement.IsGoal) return 7;
            return achievement.Type switch
            {
                "ChallengesCompleted" => 1,
                "ScorePercentage" => 2,
                "SecondAttemptImprovement" or "SameChallengeAttempts" => 3,
                "ChallengesCreated" or "CreatorUniqueParticipants" => 4,
                "ChallengeLeaderboardPosition" => 5,
                "CoreLeaderboardPosition" => 6,
                _ => 99
            };
        }

        private static MilestoneResult CalculateMilestone(int totalPoints, int maxPoints)
        {
            if (maxPoints <= 0)
                return new("Getting Started", "🌱", "Every expert has to start somewhere.", 0, 0, 0);

            int bronze = (int)Math.Ceiling(maxPoints * 0.20);
            int silver = (int)Math.Ceiling(maxPoints * 0.40);
            int gold = (int)Math.Ceiling(maxPoints * 0.60);
            int diamond = (int)Math.Ceiling(maxPoints * 0.80);

            if (totalPoints >= maxPoints)
                return new("Legend", "👑",
                    "Congratulations! You have officially achieved maximum knowledge. There is clearly nothing left to learn.",
                    maxPoints, maxPoints, 100);

            string name, icon, message;
            int current, next;
            if (totalPoints >= diamond)
            {
                (name, icon, message, current, next) = ("Diamond", "💎",
                    "Maximum knowledge is dangerously close. Science is concerned.", diamond, maxPoints);
            }
            else if (totalPoints >= gold)
            {
                (name, icon, message, current, next) = ("Gold", "🥇",
                    "Impressive. People might start asking you for help now.", gold, diamond);
            }
            else if (totalPoints >= silver)
            {
                (name, icon, message, current, next) = ("Silver", "🥈",
                    "Things are getting serious. You might actually know what you're doing.", silver, gold);
            }
            else if (totalPoints >= bronze)
            {
                (name, icon, message, current, next) = ("Bronze", "🥉",
                    "Not bad. You definitely know more than when you started.", bronze, silver);
            }
            else
            {
                (name, icon, message, current, next) = ("Getting Started", "🌱",
                    "Every expert has to start somewhere.", 0, bronze);
            }

            int progress = next <= current ? 100 : Math.Clamp(
                (int)Math.Round((double)(totalPoints - current) / (next - current) * 100), 0, 100);
            return new(name, icon, message, current, next, progress);
        }

        private sealed record MilestoneResult(
            string MilestoneName,
            string MilestoneIcon,
            string MilestoneMessage,
            int CurrentMilestonePoints,
            int NextMilestonePoints,
            int ProgressPercent);
    }

    public class AchievementSaveRequest
    {
        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty;

        public int Points { get; set; } = 5;
        public int RequirementValue { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
