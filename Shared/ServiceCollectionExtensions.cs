using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Shared;

public static class ServiceCollectionExtensions
{
    public static string RequireJwtKey(this IConfiguration config)
    {
        var jwtKey = config["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
            throw new InvalidOperationException(
                "Jwt:Key is not configured. Set the shared Jwt__Key environment variable (all services must use the same signing key).");
        return jwtKey;
    }

    public static IServiceCollection AddAllowAngularCors(this IServiceCollection services, string[] allowedOrigins) =>
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAngular", policy =>
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod());
        });
}
