
namespace GamificationPlatform.DTOs
{
    public class ChallengeDTO
    {
        public int ChallengeId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsPublished { get; set; }

        public bool IsCore { get; set; }

        public int? TimeLimitMinutes { get; set; }

        public int MaxPoints { get; set; }

        public int QuestionCount { get; set; }

        public int CreatedByUserId { get; set; }
    }
}
