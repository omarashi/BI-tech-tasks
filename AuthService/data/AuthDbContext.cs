using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                Role = "Admin",
                PasswordHash = "AQAAAAIAAYagAAAAED8AU4vnthdHOMHKrYMCLTWEaz+KglvvV+pDXxAM2GYmJSt44ZMPoxAOIXE/JJfm4g=="
            },
            new User
            {
                Id = 2,
                Username = "user",
                Role = "User",
                PasswordHash = "AQAAAAIAAYagAAAAEDhY2vdlraYvuBY6eM07/MWvwR0HTl6cq5oHhSSM4K4RZNXSOLr3uuZckV05sPVKyg=="
            });
    }
}
