
namespace GamificationPlatform.DTOs
{
    public class QuestionOptionDTO
    {
        public int QuestionOptionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
}
