using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ProductService.Models;

namespace ProductService.Data;

public class ProductDbContext : DbContext
{
    public ProductDbContext(DbContextOptions<ProductDbContext> options) : base(options) { }

    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var decimalConverter = new ValueConverter<decimal, double>(
            v => (double)v,
            v => (decimal)v);

        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasConversion(decimalConverter);

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Electronics" },
            new Category { Id = 2, Name = "Books" });

        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Name = "Keyboard", Description = "Mechanical", Price = 49.99m, Stock = 100, CategoryId = 1 },
            new Product { Id = 2, Name = "Mouse", Description = "Wireless", Price = 24.50m, Stock = 50, CategoryId = 1 },
            new Product { Id = 3, Name = "C# Book", Description = "For beginners", Price = 39.99m, Stock = 20, CategoryId = 2 });
    }
}
