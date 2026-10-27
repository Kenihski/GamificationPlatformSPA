
namespace GamificationPlatform.DTOs
{
    public class AdminUserDTO
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "";
        public int ChallengesCreated { get; set; }
    }
}
