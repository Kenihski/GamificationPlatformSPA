
using GamificationPlatform.DAL;
using GamificationPlatform.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserRepository userRepository,
            UserManager<User> userManager,
            ILogger<UsersController> logger)
        {
            _userRepository = userRepository;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userRepository.GetAllUsersAsync();
            var result = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                result.Add(new
                {
                    UserId = user.Id,
                    Username = user.UserName,
                    Email = user.Email,
                    Roles = roles,
                    ChallengesCreated = user.CreatedChallenges.Count
                });
            }

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUserDetails(int id)
        {
            var user = await _userRepository.GetUserWithDetailsAsync(id);

            if (user == null)
                return NotFound();

            var createdChallenges = user.CreatedChallenges
                .Select(challenge => new
                {
                    challenge.ChallengeId,
                    challenge.Title,
                    challenge.Description,
                    challenge.ImageUrl,
                    challenge.IsPublished,
                    challenge.IsCore,
                    Questions = challenge.Questions.Count,
                    MaxPoints = challenge.Questions.Sum(
                        question => question.Points)
                })
                .ToList();

            var challengeHistory = user.UserChallenges
                .Select(userChallenge =>
                {
                    var attempts = userChallenge.Attempts
                        .Where(attempt => attempt.Completed)
                        .OrderByDescending(attempt => attempt.CompletedAt)
                        .ToList();

                    if (attempts.Count == 0)
                        return null;

                    var chronological = attempts
                        .OrderBy(attempt => attempt.CompletedAt)
                        .ThenBy(attempt => attempt.ChallengeAttemptId)
                        .ToList();

                    var latest = attempts.First();

                    var best = attempts
                        .OrderByDescending(attempt => attempt.Score)
                        .ThenBy(attempt =>
                            (attempt.CompletedAt ?? attempt.StartedAt)
                            - attempt.StartedAt)
                        .First();

                    return new
                    {
                        userChallenge.Challenge.ChallengeId,
                        ChallengeTitle = userChallenge.Challenge.Title,
                        MaxPoints = userChallenge.Challenge.Questions.Sum(
                            question => question.Points),

                        Attempts = attempts.Select(attempt =>
                        {
                            var duration =
                                attempt.CompletedAt - attempt.StartedAt;

                            string? timeUsed = duration.HasValue
                                ? duration.Value.TotalMinutes >= 1
                                    ? $"{Math.Round(duration.Value.TotalMinutes)} min"
                                    : $"{Math.Round(duration.Value.TotalSeconds)} sec"
                                : null;

                            return new
                            {
                                attempt.ChallengeAttemptId,

                                AttemptNumber = chronological.FindIndex(
                                    item => item.ChallengeAttemptId ==
                                        attempt.ChallengeAttemptId) + 1,

                                attempt.Score,
                                TimeUsed = timeUsed,

                                CompletedAt = attempt.CompletedAt?
                                    .ToString("dd.MM.yyyy HH:mm"),

                                IsBest = attempt.ChallengeAttemptId ==
                                    best.ChallengeAttemptId,

                                IsLatest = attempt.ChallengeAttemptId ==
                                    latest.ChallengeAttemptId
                            };
                        }).ToList()
                    };
                })
                .Where(history => history != null)
                .ToList();

            _logger.LogInformation(
                "Admin viewed details for user {UserId}.", id);

            return Ok(new
            {
                User = new
                {
                    UserId = user.Id,
                    Username = user.UserName,
                    user.Email
                },
                CreatedChallenges = createdChallenges,
                ChallengeHistory = challengeHistory
            });
        }
    }
}
