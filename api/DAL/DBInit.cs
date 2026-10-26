
using GamificationPlatform.Models;
using GamificationPlatform.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GamificationPlatform.DAL
{
    public static class DBInit
    {
        public static async Task SeedAsync(WebApplication app)
        {
            // Seed development data only.
            if (!app.Environment.IsDevelopment())
            {
                return;
            }

            using var scope = app.Services.CreateScope();

            var context = scope.ServiceProvider
                .GetRequiredService<ChallengeDbContext>();

            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<User>>();

            var roleManager = scope.ServiceProvider
                .GetRequiredService<RoleManager<IdentityRole<int>>>();

            var achievementService = scope.ServiceProvider
                .GetRequiredService<IAchievementService>();

            var logger = scope.ServiceProvider
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("GamificationPlatform.DAL.DBInit");

            // Apply pending migrations without deleting the database.
            await context.Database.MigrateAsync();

            if (await context.Users.AnyAsync())
            {
                logger.LogInformation(
                    "Database already contains users. Skipping development seeding.");

                return;
            }

            logger.LogInformation("Development database seeding started.");

            await UserSeeder.SeedAsync(context, userManager, roleManager);

            AchievementSeeder.Seed(context);
            ChallengeSeeder.Seed(context);
            QuestionSeeder.Seed(context);
            AttemptSeeder.Seed(context);

            await ActivitySeeder.SeedAsync(context, userManager);

            // Calculate achievements after all demo activity is created.
            await achievementService.CheckAchievementsForAllUsersAsync();

            logger.LogInformation("Development database seeding completed.");
        }
    }
}
