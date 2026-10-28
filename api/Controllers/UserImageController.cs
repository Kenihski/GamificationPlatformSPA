using System.Security.Claims;
using GamificationPlatform.DAL;
using GamificationPlatform.Models;
using GamificationPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/images")]
    public class UserImageController : ControllerBase
    {
        private const long MaxFileSize = 5 * 1024 * 1024;

        private readonly IImageService _imageService;
        private readonly IUserImageRepository _imageRepository;
        private readonly ChallengeDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<UserImageController> _logger;

        public UserImageController(
            IImageService imageService,
            IUserImageRepository imageRepository,
            ChallengeDbContext context,
            IWebHostEnvironment environment,
            ILogger<UserImageController> logger)
        {
            _imageService = imageService;
            _imageRepository = imageRepository;
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        [HttpGet("default")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDefaultImages()
        {
            var images = await _imageService.GetDefaultImagesAsync();

            return Ok(images.Select(image => new
            {
                image.DefaultImageId,
                image.Name,
                image.FileName,
                image.ImageUrl
            }));
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMyImages()
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var images = await _imageService.GetUserImagesAsync(userId);

            return Ok(images.Select(image => new
            {
                image.UserImageId,
                image.FileName,
                image.ImageUrl
            }));
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(
            [FromForm] IFormFile? file)
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("Please select an image.");
            }

            var result = await _imageService.SaveImageAsync(file, userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.ErrorMessage);
            }

            _logger.LogInformation(
                "User {UserId} uploaded image {ImageUrl}.",
                userId,
                result.ImageUrl);

            return Ok(new
            {
                result.ImageUrl
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteImage(int id)
        {
            if (!TryGetCurrentUserId(out int userId))
            {
                return Unauthorized();
            }

            var image = await _imageRepository.GetImageByIdAsync(id);

            if (image == null)
            {
                return NotFound();
            }

            if (image.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            // Clear image references before deleting the image.
            var challenges = await _context.Challenges
                .Where(c => c.ImageUrl == image.ImageUrl)
                .ToListAsync();

            var questions = await _context.Questions
                .Where(q => q.ImageUrl == image.ImageUrl)
                .ToListAsync();

            foreach (var challenge in challenges)
            {
                challenge.ImageUrl = string.Empty;
            }

            foreach (var question in questions)
            {
                question.ImageUrl = string.Empty;
            }

            _context.UserImages.Remove(image);
            await _context.SaveChangesAsync();

            string filePath = Path.Combine(
                _environment.WebRootPath,
                "uploads",
                "images",
                Path.GetFileName(image.ImageUrl));

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _logger.LogInformation(
                "User {UserId} deleted image {ImageId}.",
                userId,
                id);

            return NoContent();
        }

        // Admin image management

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllImages()
        {
            // Include the uploader's username.
            var userImages = await _context.UserImages
                .Include(image => image.User)
                .ToListAsync();

            var defaultImages = await _imageService.GetDefaultImagesAsync();

            return Ok(new
            {
                UserImages = userImages.Select(image => new
                {
                    image.UserImageId,
                    image.UserId,
                    UserName = image.User?.UserName,
                    image.FileName,
                    image.ImageUrl
                }),
                DefaultImages = defaultImages.Select(image => new
                {
                    image.DefaultImageId,
                    image.Name,
                    image.FileName,
                    image.ImageUrl
                })
            });
        }

        [HttpPost("default")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDefaultImage(
            [FromForm] string name,
            [FromForm] IFormFile? file)
        {
            name = name?.Trim() ?? string.Empty;

            if (name.Length == 0 || name.Length > 100)
            {
                return BadRequest(
                    "Image name must contain between 1 and 100 characters.");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("Please select an image.");
            }

            string extension = Path.GetExtension(file.FileName)
                .ToLowerInvariant();

            if (file.Length > MaxFileSize ||
                extension != ".jpg" &&
                extension != ".jpeg" &&
                extension != ".png" &&
                extension != ".webp")
            {
                return BadRequest(
                    "Choose a JPG, PNG or WebP image up to 5 MB.");
            }

            if (!await HasValidImageSignatureAsync(file, extension))
            {
                return BadRequest(
                    "The file does not match a supported image format.");
            }

            string fileName = $"{Guid.NewGuid():N}{extension}";
            string folder = Path.Combine(
                _environment.WebRootPath,
                "images");

            Directory.CreateDirectory(folder);

            string filePath = Path.Combine(folder, fileName);

            try
            {
                await using (var stream =
                    new FileStream(filePath, FileMode.CreateNew))
                {
                    await file.CopyToAsync(stream);
                }

                var image = new DefaultImage
                {
                    Name = name,
                    FileName = Path.GetFileName(file.FileName),
                    ImageUrl = $"/images/{fileName}"
                };

                _context.DefaultImages.Add(image);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Admin uploaded default image {ImageId}.",
                    image.DefaultImageId);

                return Ok(new
                {
                    image.DefaultImageId,
                    image.Name,
                    image.FileName,
                    image.ImageUrl
                });
            }
            catch (Exception ex)
            {
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                _logger.LogError(ex, "Default image upload failed.");

                return StatusCode(500, "Could not upload the image.");
            }
        }

        [HttpPut("default/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RenameDefaultImage(
            int id,
            [FromBody] RenameDefaultImageRequest request)
        {
            var image = await _context.DefaultImages.FindAsync(id);

            if (image == null)
            {
                return NotFound();
            }

            string name = request.Name?.Trim() ?? string.Empty;

            if (name.Length == 0 || name.Length > 100)
            {
                return BadRequest(
                    "Image name must contain between 1 and 100 characters.");
            }

            image.Name = name;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("default/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDefaultImage(int id)
        {
            var image = await _context.DefaultImages.FindAsync(id);

            if (image == null)
            {
                return NotFound();
            }

            // Clear references to the deleted default image.
            var challenges = await _context.Challenges
                .Where(c => c.ImageUrl == image.ImageUrl)
                .ToListAsync();

            var questions = await _context.Questions
                .Where(q => q.ImageUrl == image.ImageUrl)
                .ToListAsync();

            foreach (var challenge in challenges)
            {
                challenge.ImageUrl = string.Empty;
            }

            foreach (var question in questions)
            {
                question.ImageUrl = string.Empty;
            }

            _context.DefaultImages.Remove(image);
            await _context.SaveChangesAsync();

            string filePath = Path.Combine(
                _environment.WebRootPath,
                "images",
                Path.GetFileName(image.ImageUrl));

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _logger.LogInformation(
                "Admin deleted default image {ImageId}.",
                id);

            return NoContent();
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userIdValue, out userId);
        }

        // Verify that the file content matches its extension.
        private static async Task<bool> HasValidImageSignatureAsync(
            IFormFile file,
            string extension)
        {
            byte[] header = new byte[12];

            await using var stream = file.OpenReadStream();

            int count = 0;

            while (count < header.Length)
            {
                int bytesRead = await stream.ReadAsync(
                    header.AsMemory(count));

                if (bytesRead == 0)
                {
                    break;
                }

                count += bytesRead;
            }

            bool jpeg =
                count >= 3 &&
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF;

            bool png =
                count >= 8 &&
                header.AsSpan(0, 8).SequenceEqual(
                    new byte[]
                    {
                        137, 80, 78, 71, 13, 10, 26, 10
                    });

            bool webp =
                count >= 12 &&
                System.Text.Encoding.ASCII.GetString(
                    header, 0, 4) == "RIFF" &&
                System.Text.Encoding.ASCII.GetString(
                    header, 8, 4) == "WEBP";

            return extension switch
            {
                ".jpg" or ".jpeg" => jpeg,
                ".png" => png,
                ".webp" => webp,
                _ => false
            };
        }
    }

    public class RenameDefaultImageRequest
    {
        public string Name { get; set; } = string.Empty;
    }
}
