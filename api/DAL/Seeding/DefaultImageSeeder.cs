
using GamificationPlatform.Models;
using Microsoft.EntityFrameworkCore;

namespace GamificationPlatform.DAL
{
    public static class DefaultImageSeeder
    {
        public static async Task SeedAsync(
            ChallengeDbContext context,
            IWebHostEnvironment environment)
        {
            // Initialize bundled images only when the table is empty.
            if (await context.DefaultImages.AnyAsync())
            {
                return;
            }

            string imagesFolder = Path.Combine(
                environment.WebRootPath,
                "images");

            if (!Directory.Exists(imagesFolder))
            {
                return;
            }

            var imageFiles = Directory
                .EnumerateFiles(imagesFolder)
                .Where(path =>
                    new[] { ".png", ".jpg", ".jpeg", ".webp" }
                        .Contains(Path.GetExtension(path).ToLowerInvariant()))
                .OrderBy(path => Path.GetFileName(path))
                .ToList();

            foreach (string filePath in imageFiles)
            {
                string fileName = Path.GetFileName(filePath);
                string name = Path.GetFileNameWithoutExtension(fileName)
                    .Replace("_", " ");

                context.DefaultImages.Add(new DefaultImage
                {
                    Name = name,
                    FileName = fileName,
                    ImageUrl = $"/images/{fileName}"
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
