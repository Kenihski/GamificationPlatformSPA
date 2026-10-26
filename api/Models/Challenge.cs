
using System.ComponentModel.DataAnnotations;
using GamificationPlatform.Validation;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace GamificationPlatform.Models
{
    public class Challenge
    {
        public int ChallengeId { get; set; }

        [Required(ErrorMessage = "Challenge title is required.")]
        [StringLength(
            100,
            ErrorMessage = "Title cannot be longer than 100 characters.")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        [StringLength(
            500,
            ErrorMessage = "Description cannot be longer than 500 characters.")]
        public string Description { get; set; } = string.Empty;

        public int MaxPoints { get; set; }

        [ValidateNever]
        [AllowedImage(ErrorMessage = "Please select one of the available images.")]
        public string ImageUrl { get; set; } = string.Empty;

        // Null means unlimited time.
        [AllowedTimeLimit(ErrorMessage = "Choose unlimited or a time limit of 10, 20, 30, 60, 90, or 120 minutes.")]
        public int? TimeLimitMinutes { get; set; }

        // False = Draft, True = Published.
        public bool IsPublished { get; set; } = false;

        // False = Community, True = Core.
        public bool IsCore { get; set; } = false;

        // Controls whether participants can review answers after completion.
        public bool ShowAnswersAfterCompletion { get; set; } = true;

        public int CreatedByUserId { get; set; }

        public virtual User CreatedByUser { get; set; } = default!;

        public virtual List<Question> Questions { get; set; }
            = new List<Question>();

        public virtual List<UserChallenge> UserChallenges { get; set; }
            = new List<UserChallenge>();
    }
}
