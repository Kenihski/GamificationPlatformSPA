using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GamificationPlatform.DTOs;
using GamificationPlatform.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace GamificationPlatform.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDTO>> Login(
            [FromBody] LoginDTO dto)
        {
            var usernameOrEmail = dto.UsernameOrEmail.Trim();

            // Support login with either username or email.
            var user = await _userManager.FindByNameAsync(usernameOrEmail)
                ?? await _userManager.FindByEmailAsync(usernameOrEmail);

            if (user == null)
            {
                return Unauthorized("Invalid username/email or password.");
            }

            // Validate the password and enforce Identity lockout rules.
            var result = await _signInManager.CheckPasswordSignInAsync(
                user, dto.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                _logger.LogWarning(
                    "Failed login attempt for user {UserId}.",
                    user.Id);

                return Unauthorized("Invalid username/email or password.");
            }

            var jwtKey = _configuration["Jwt:Key"]!;
            var jwtIssuer = _configuration["Jwt:Issuer"]!;
            var jwtAudience = _configuration["Jwt:Audience"]!;

            var expiresAt = DateTime.UtcNow.AddHours(2);

            // Include the user ID for authorization and ownership checks.
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString())
            };

            // Include Identity roles for role-based API authorization.
            var roles = await _userManager.GetRolesAsync(user);

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(
                Convert.FromBase64String(jwtKey));

            var credentials = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            var tokenString =
                new JwtSecurityTokenHandler().WriteToken(token);

            _logger.LogInformation(
                "User {UserId} logged in successfully.",
                user.Id);

            return Ok(new AuthResponseDTO
            {
                Token = tokenString,
                ExpiresAt = expiresAt,
                UserId = user.Id,
                Username = user.UserName ?? string.Empty
            });
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(
            [FromBody] RegisterDTO dto)
        {
            dto.Username = dto.Username.Trim();
            dto.Email = dto.Email.Trim();

            // Check whether username or email is already registered.
            if (await _userManager.FindByNameAsync(dto.Username) != null)
            {
                return BadRequest(new
                {
                    message = "This username is already taken."
                });
            }

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
            {
                return BadRequest(new
                {
                    message = "This email is already registered."
                });
            }

            var user = new User
            {
                UserName = dto.Username,
                Email = dto.Email
            };

            // Identity hashes the password before storing the user.
            var result = await _userManager.CreateAsync(
                user, dto.Password);

            if (!result.Succeeded)
            {
                _logger.LogWarning("User registration failed.");

                return BadRequest(new
                {
                    message = "Registration failed.",
                    errors = result.Errors.Select(
                        error => error.Description)
                });
            }

            _logger.LogInformation(
                "User {UserId} registered successfully.",
                user.Id);

            // Require the user to log in after registration.
            return Ok(new
            {
                message = "Registration successful. Please log in."
            });
        }
    }
}
