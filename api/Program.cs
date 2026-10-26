
using GamificationPlatform.DAL;
using GamificationPlatform.Models;
using GamificationPlatform.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure logging.
var logFileName = $"Logs/log-{DateTime.Now:yyyyMMdd_HHmmss}.txt";

builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(logFileName);
});

// Register API controllers.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Configure the separate SQLite database.
builder.Services.AddDbContext<ChallengeDbContext>(options =>
{
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Configure ASP.NET Core Identity.
builder.Services
    .AddIdentity<User, IdentityRole<int>>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;

        options.User.RequireUniqueEmail = true;

        options.Lockout.DefaultLockoutTimeSpan =
            TimeSpan.FromMinutes(5);
        options.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddEntityFrameworkStores<ChallengeDbContext>()
    .AddDefaultTokenProviders();

// Register repositories.
builder.Services.AddScoped<IChallengeRepository, ChallengeRepository>();
builder.Services.AddScoped<IAttemptRepository, AttemptRepository>();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAchievementRepository, AchievementRepository>();
builder.Services.AddScoped<IUserImageRepository, UserImageRepository>();

// Register business services.
builder.Services.AddScoped<IAchievementService, AchievementService>();
builder.Services.AddScoped<IImageService, ImageService>();

// Allow the React development server to access the API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactDevelopment", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSerilogRequestLogging();

app.UseStaticFiles();

app.UseRouting();
app.UseCors("ReactDevelopment");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed development data without deleting the existing database.
if (app.Environment.IsDevelopment())
{
    await DBInit.SeedAsync(app);
}

app.Run();
