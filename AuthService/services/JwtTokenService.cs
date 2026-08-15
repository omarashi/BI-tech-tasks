using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Models;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Services;

public class JwtTokenService
{
    private readonly string _key;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtTokenService(IConfiguration config)
    {
        _key = config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured");
        _issuer = config["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured");
        _audience = config["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured");
    }

    public string CreateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString(), ClaimValueTypes.Integer32),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)   // ← this enables permission-based auth!
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}