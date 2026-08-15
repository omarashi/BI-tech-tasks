using AuthService.Data;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Shared;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthDbContext _db;
    private readonly JwtTokenService _tokenService;

    public AuthController(AuthDbContext db, JwtTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null) return Unauthorized("Invalid credentials");

        var hasher = new PasswordHasher<User>();
        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid credentials");

        var token = _tokenService.CreateToken(user);
        return Ok(new
        {
            token,
            user = new UserDto { Id = user.Id, Username = user.Username, Role = user.Role }
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Unable to register. Please check your details.");

        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (existing != null)
            return BadRequest("Unable to register. Please check your details.");

        var hasher = new PasswordHasher<User>();
        var user = new User
        {
            Username = request.Username,
            Role = "User",
            PasswordHash = hasher.HashPassword(new User(), request.Password)
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.CreateToken(user);
        return Ok(new
        {
            token,
            user = new UserDto { Id = user.Id, Username = user.Username, Role = user.Role }
        });
    }
}
