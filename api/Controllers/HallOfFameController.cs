using GamificationPlatform.DAL;
using GamificationPlatform.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Route("api/hall-of-fame")]
    public class HallOfFameController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IAchievementRepository _achievementRepository;
        private readonly ILogger<HallOfFameController> _logger;

        public HallOfFameController(
            UserManager<User> userManager,
            IAchievementRepository achievementRepository,
            ILogger<HallOfFameController> logger)
        {
            _userManager = userManager;
            _achievementRepository = achievementRepository;
            _logger = logger;
        }

        // Public ranking based on active, regular achievement points.
        [HttpGet]
        public async Task<IActionResult> GetHallOfFame()
        {
            var users = await _userManager.Users.ToListAsync();
            var activeAchievements = (await _achievementRepository.GetActiveAsync()).ToList();
            int maxPoints = activeAchievements.Where(a => !a.IsGoal).Sum(a => a.Points);

            var entries = new List<HallOfFameEntry>();
            foreach (var user in users)
            {
                if (await _userManager.IsInRoleAsync(user, "Admin"))
                    continue;

                var unlocked = (await _achievementRepository.GetUserAchievementsAsync(user.Id))
                    .Where(ua => ua.Achievement.IsActive)
                    .ToList();

                int points = unlocked.Where(ua => !ua.Achievement.IsGoal)
                    .Sum(ua => ua.Achievement.Points);
                var milestone = GetMilestone(points, maxPoints);

                entries.Add(new HallOfFameEntry
                {
                    UserId = user.Id,
                    Username = user.UserName ?? "",
                    AchievementCount = unlocked.Count,
                    AchievementPoints = points,
                    MilestoneName = milestone.Name,
                    MilestoneIcon = milestone.Icon
                });
            }

            entries = entries.OrderByDescending(e => e.AchievementPoints)
                .ThenBy(e => e.Username)
                .ToList();

            int rank = 0;
            int? previousPoints = null;
            foreach (var entry in entries)
            {
                // Dense ranking: users with equal AP share a rank.
                if (previousPoints == null || entry.AchievementPoints != previousPoints)
                    rank++;
                entry.Rank = rank;
                previousPoints = entry.AchievementPoints;
            }

            _logger.LogInformation("Hall of Fame viewed.");
            return Ok(new { Users = entries });
        }

        // Public achievement profile for a non-admin user.
        [HttpGet("users/{id:int}/achievements")]
        public async Task<IActionResult> GetUserAchievements(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null || await _userManager.IsInRoleAsync(user, "Admin"))
                return NotFound();

            var achievements = (await _achievementRepository.GetActiveAsync())
                .OrderBy(GetCategoryOrder)
                .ThenBy(a => a.RequirementValue)
                .ThenBy(a => a.AchievementId)
                .ToList();

            var unlocked = (await _achievementRepository.GetUserAchievementsAsync(id))
                .Where(ua => ua.Achievement.IsActive)
                .ToList();
            var unlockedById = unlocked.ToDictionary(ua => ua.AchievementId);

            int totalPoints = unlocked.Where(ua => !ua.Achievement.IsGoal)
                .Sum(ua => ua.Achievement.Points);
            int maxPoints = achievements.Where(a => !a.IsGoal).Sum(a => a.Points);
            var milestone = CalculateMilestone(totalPoints, maxPoints);

            _logger.LogInformation("Public achievements viewed for user {UserId}.", id);
            return Ok(new
            {
                Username = user.UserName ?? "",
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
                    unlockedById.TryGetValue(a.AchievementId, out var ua);
                    return new
                    {
                        a.AchievementId,
                        a.Name,
                        a.Description,
                        a.Points,
                        a.IsGoal,
                        IsUnlocked = ua != null,
                        UnlockedAt = ua?.UnlockedAt
                    };
                }).ToList()
            });
        }

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

        private static (string Name, string Icon) GetMilestone(int points, int maxPoints)
        {
            if (maxPoints <= 0) return ("Getting Started", "🌱");
            if (points >= maxPoints) return ("Legend", "👑");
            if (points >= (int)Math.Ceiling(maxPoints * 0.80)) return ("Diamond", "💎");
            if (points >= (int)Math.Ceiling(maxPoints * 0.60)) return ("Gold", "🥇");
            if (points >= (int)Math.Ceiling(maxPoints * 0.40)) return ("Silver", "🥈");
            if (points >= (int)Math.Ceiling(maxPoints * 0.20)) return ("Bronze", "🥉");
            return ("Getting Started", "🌱");
        }

        private static MilestoneResponse CalculateMilestone(int points, int maxPoints)
        {
            int bronze = (int)Math.Ceiling(maxPoints * 0.20);
            int silver = (int)Math.Ceiling(maxPoints * 0.40);
            int gold = (int)Math.Ceiling(maxPoints * 0.60);
            int diamond = (int)Math.Ceiling(maxPoints * 0.80);

            string name, icon, message;
            int current, next;
            if (maxPoints <= 0)
            {
                (name, icon, message, current, next) =
                    ("Getting Started", "🌱", "Every expert has to start somewhere.", 0, 0);
            }
            else if (points >= maxPoints)
            {
                (name, icon, message, current, next) =
                    ("Legend", "👑", "Congratulations! You have officially achieved maximum knowledge. There is clearly nothing left to learn.", maxPoints, maxPoints);
            }
            else if (points >= diamond)
            {
                (name, icon, message, current, next) =
                    ("Diamond", "💎", "Maximum knowledge is dangerously close. Science is concerned.", diamond, maxPoints);
            }
            else if (points >= gold)
            {
                (name, icon, message, current, next) =
                    ("Gold", "🥇", "Impressive. People might start asking you for help now.", gold, diamond);
            }
            else if (points >= silver)
            {
                (name, icon, message, current, next) =
                    ("Silver", "🥈", "Things are getting serious. You might actually know what you're doing.", silver, gold);
            }
            else if (points >= bronze)
            {
                (name, icon, message, current, next) =
                    ("Bronze", "🥉", "Not bad. You definitely know more than when you started.", bronze, silver);
            }
            else
            {
                (name, icon, message, current, next) =
                    ("Getting Started", "🌱", "Every expert has to start somewhere.", 0, bronze);
            }

            int progress = next <= current ? (maxPoints > 0 ? 100 : 0)
                : Math.Clamp((int)Math.Round((double)(points - current) / (next - current) * 100), 0, 100);

            return new MilestoneResponse
            {
                MilestoneName = name,
                MilestoneIcon = icon,
                MilestoneMessage = message,
                CurrentMilestonePoints = current,
                NextMilestonePoints = next,
                ProgressPercent = progress
            };
        }

        private sealed class MilestoneResponse
        {
            public string MilestoneName { get; set; } = "";
            public string MilestoneIcon { get; set; } = "";
            public string MilestoneMessage { get; set; } = "";
            public int CurrentMilestonePoints { get; set; }
            public int NextMilestonePoints { get; set; }
            public int ProgressPercent { get; set; }
        }

        private sealed class HallOfFameEntry
        {
            public int Rank { get; set; }
            public int UserId { get; set; }
            public string Username { get; set; } = "";
            public string MilestoneName { get; set; } = "";
            public string MilestoneIcon { get; set; } = "";
            public int AchievementCount { get; set; }
            public int AchievementPoints { get; set; }
        }
    }
}
