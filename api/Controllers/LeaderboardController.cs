using GamificationPlatform.DAL;
using GamificationPlatform.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Route("api/leaderboard")]
    public class LeaderboardController : ControllerBase
    {
        private readonly IChallengeRepository _challengeRepository;
        private readonly IAttemptRepository _attemptRepository;
        private readonly UserManager<User> _userManager;

        public LeaderboardController(
            IChallengeRepository challengeRepository,
            IAttemptRepository attemptRepository,
            UserManager<User> userManager)
        {
            _challengeRepository = challengeRepository;
            _attemptRepository = attemptRepository;
            _userManager = userManager;
        }

        [HttpGet("challenges/{id:int}")]
        public async Task<IActionResult> GetChallengeLeaderboard(int id)
        {
            var challenge = await _challengeRepository.GetChallengeWithQuestionsAsync(id);
            if (challenge == null)
            {
                return NotFound();
            }

            if (!challenge.IsPublished &&
                !User.IsInRole("Admin") &&
                (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int currentUserId) ||
                 challenge.CreatedByUserId != currentUserId))
            {
                return NotFound();
            }

            int maxPoints = challenge.Questions.Sum(q => q.Points);
            var attempts = await _attemptRepository.GetCompletedAttemptsForChallengeAsync(id);
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            var adminIds = adminUsers.Select(u => u.Id).ToHashSet();

            var firstAttempts = attempts
                .Where(a => !adminIds.Contains(a.UserChallenge.UserId) &&
                            a.UserChallenge.UserId != challenge.CreatedByUserId)
                .GroupBy(a => a.UserChallenge.UserId)
                .Select(g => g.OrderBy(a => a.CompletedAt)
                              .ThenBy(a => a.ChallengeAttemptId).First())
                .Where(a => a.Score > 0 && a.CompletedAt.HasValue)
                .OrderByDescending(a => a.Score)
                .ThenBy(a => a.CompletedAt!.Value - a.StartedAt)
                .ToList();

            int rank = 0;
            int? previousScore = null;
            TimeSpan? previousTime = null;
            var entries = new List<object>();

            foreach (var attempt in firstAttempts)
            {
                TimeSpan timeUsed = attempt.CompletedAt!.Value - attempt.StartedAt;
                if (previousScore == null || attempt.Score != previousScore || timeUsed != previousTime)
                {
                    rank++;
                }

                entries.Add(new
                {
                    Rank = rank,
                    UserId = attempt.UserChallenge.UserId,
                    Username = attempt.UserChallenge.User.UserName ?? string.Empty,
                    attempt.Score,
                    attempt.StartedAt,
                    attempt.CompletedAt,
                    TimeUsedSeconds = Math.Max(0, (int)Math.Round(timeUsed.TotalSeconds))
                });

                previousScore = attempt.Score;
                previousTime = timeUsed;
            }

            return Ok(new
            {
                challenge.ChallengeId,
                challenge.Title,
                MaxPoints = maxPoints,
                Entries = entries
            });
        }

        [HttpGet("total")]
        public async Task<IActionResult> GetTotalLeaderboard()
        {
            var attempts = await _attemptRepository.GetAllCompletedAttemptsAsync();
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            var adminIds = adminUsers.Select(u => u.Id).ToHashSet();

            // Only first completed attempts on Core Challenges count.
            var firstAttempts = attempts
                .Where(a => !adminIds.Contains(a.UserChallenge.UserId) &&
                            a.UserChallenge.Challenge.IsCore &&
                            a.UserChallenge.UserId != a.UserChallenge.Challenge.CreatedByUserId)
                .GroupBy(a => new { a.UserChallenge.UserId, a.UserChallenge.ChallengeId })
                .Select(g => g.OrderBy(a => a.CompletedAt)
                              .ThenBy(a => a.ChallengeAttemptId).First())
                .Where(a => a.Score > 0 && a.CompletedAt.HasValue)
                .ToList();

            var ranked = firstAttempts
                .GroupBy(a => a.UserChallenge.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Username = g.First().UserChallenge.User.UserName ?? string.Empty,
                    TotalPoints = Math.Round(g.Sum(a =>
                    {
                        int maxPoints = a.UserChallenge.Challenge.Questions.Sum(q => q.Points);
                        return maxPoints > 0 ? (double)a.Score / maxPoints * 100 : 0;
                    }), 1),
                    CoreChallengesCompleted = g.Count(),
                    TotalTime = TimeSpan.FromTicks(g.Sum(a =>
                        (a.CompletedAt!.Value - a.StartedAt).Ticks))
                })
                .OrderByDescending(e => e.TotalPoints)
                .ThenBy(e => e.CoreChallengesCompleted)
                .ThenBy(e => e.TotalTime)
                .ToList();

            int rank = 0;
            double? previousPoints = null;
            int? previousCount = null;
            TimeSpan? previousTime = null;
            var entries = new List<object>();

            foreach (var entry in ranked)
            {
                if (previousPoints == null ||
                    entry.TotalPoints != previousPoints ||
                    entry.CoreChallengesCompleted != previousCount ||
                    entry.TotalTime != previousTime)
                {
                    rank++;
                }

                entries.Add(new
                {
                    Rank = rank,
                    entry.UserId,
                    entry.Username,
                    entry.TotalPoints,
                    entry.CoreChallengesCompleted,
                    TotalTimeSeconds = Math.Max(0, (int)Math.Round(entry.TotalTime.TotalSeconds))
                });

                previousPoints = entry.TotalPoints;
                previousCount = entry.CoreChallengesCompleted;
                previousTime = entry.TotalTime;
            }

            return Ok(new { Entries = entries });
        }
    }
}
