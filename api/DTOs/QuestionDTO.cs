
namespace GamificationPlatform.DTOs
{
    public class QuestionDTO
    {
        public int QuestionId { get; set; }
        public int ChallengeId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Explanation { get; set; }
        public int Points { get; set; }
        public string? ImageUrl { get; set; }
        public string QuestionType { get; set; } = "SingleChoice";

        public List<QuestionOptionDTO> Options { get; set; } = new();
        public List<string> AcceptedAnswers { get; set; } = new();
    }
}
