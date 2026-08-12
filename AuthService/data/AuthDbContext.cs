using AuthService.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var hasher = new PasswordHasher<User>();

        var admin = new User { Id = 1, Username = "admin", Role = "Admin", PasswordHash = "" };
        admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");

        var user = new User { Id = 2, Username = "user", Role = "User", PasswordHash = "" };
        user.PasswordHash = hasher.HashPassword(user, "User@123");

        modelBuilder.Entity<User>().HasData(admin, user);
    }
}
