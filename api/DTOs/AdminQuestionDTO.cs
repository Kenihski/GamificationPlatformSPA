namespace GamificationPlatform.DTOs
{
    public class AdminQuestionDTO
    {
        public int QuestionId { get; set; }
        public int ChallengeId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Points { get; set; }
        public string? ImageUrl { get; set; }
        public string ChallengeTitle { get; set; } = string.Empty;
        public int OwnerId { get; set; }
        public string OwnerUsername { get; set; } = string.Empty;
    }
}
