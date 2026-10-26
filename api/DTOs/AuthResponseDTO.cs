
namespace GamificationPlatform.DTOs
{
    public class AuthResponseDTO
    {
        public string Token { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public int UserId { get; set; }

        public string Username { get; set; } = string.Empty;
    }
}
