
using System.ComponentModel.DataAnnotations;
using GamificationPlatform.Validation;

namespace GamificationPlatform.DTOs
{
    public class QuestionSaveDTO
    {
        [Required(ErrorMessage = "Question title is required.")]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(1000)]
        public string? Explanation { get; set; }

        [Range(1, 100)]
        public int Points { get; set; } = 10;

        [AllowedImage]
        public string? ImageUrl { get; set; }

        [Required]
        [RegularExpression(
            "^(SingleChoice|MultipleChoice|ShortAnswer)$",
            ErrorMessage = "Invalid question type.")]
        public string QuestionType { get; set; } = "SingleChoice";

        public List<QuestionOptionSaveDTO> Options { get; set; } = new();

        public List<string> AcceptedAnswers { get; set; } = new();
    }

    public class QuestionOptionSaveDTO
    {
        [Required]
        [StringLength(500)]
        public string Text { get; set; } = string.Empty;

        public bool IsCorrect { get; set; }
    }
}
