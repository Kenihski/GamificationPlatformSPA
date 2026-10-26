
using System.ComponentModel.DataAnnotations;
using GamificationPlatform.Validation;

namespace GamificationPlatform.DTOs
{
    public class ChallengeSaveDTO
    {
        [Required(ErrorMessage = "Challenge title is required.")]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public string ImageUrl { get; set; } = string.Empty;

        [AllowedTimeLimit(ErrorMessage =
            "Choose unlimited or 10, 20, 30, 60, 90, or 120 minutes.")]
        public int? TimeLimitMinutes { get; set; }

        public bool ShowAnswersAfterCompletion { get; set; } = true;
    }
}
