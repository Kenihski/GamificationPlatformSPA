using System.Security.Claims;
using GamificationPlatform.DAL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/achievement-notifications")]
    public class AchievementNotificationController : ControllerBase
    {
        private readonly IAchievementRepository _achievementRepository;

        public AchievementNotificationController(
            IAchievementRepository achievementRepository)
        {
            _achievementRepository = achievementRepository;
        }

        [HttpGet("unseen")]
        public async Task<IActionResult> GetUnseen()
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var notifications = await _achievementRepository
                .GetUnseenUserAchievementsAsync(userId);

            return Ok(notifications.Select(ua => new
            {
                UserAchievementId = ua.UserAchievementId,
                AchievementId = ua.AchievementId,
                Name = ua.Achievement.Name,
                Description = ua.Achievement.Description,
                Points = ua.Achievement.Points,
                IsGoal = ua.Achievement.IsGoal,
                UnlockedAt = ua.UnlockedAt
            }));
        }

        [HttpPost("{userAchievementId:int}/mark-seen")]
        public async Task<IActionResult> MarkSeen(int userAchievementId)
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var markedAsSeen = await _achievementRepository
                .MarkNotificationSeenAsync(userAchievementId, userId);

            if (!markedAsSeen)
            {
                return NotFound();
            }

            return Ok();
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out userId);
        }
    }
}
