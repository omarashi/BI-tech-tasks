using Microsoft.EntityFrameworkCore;
using ProductService.Data;
using ProductService.Models;
using Shared;

namespace ProductService.Services;

public interface IProductService
{
    Task<List<ProductDto>> GetAllAsync();
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(ProductDto dto);
    Task<bool> UpdateAsync(int id, ProductDto dto);
    Task<bool> DeleteAsync(int id);
}

public class ProductService : IProductService
{
    private readonly ProductDbContext _db;

    public ProductService(ProductDbContext db) => _db = db;

    private static ProductDto ToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        Price = p.Price,
        Stock = p.Stock,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? string.Empty
    };

    public async Task<List<ProductDto>> GetAllAsync()
    {
        var products = await _db.Products.Include(p => p.Category).ToListAsync();
        return products.Select(p => ToDto(p)).ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var p = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        return p == null ? null : ToDto(p);
    }

    public async Task<ProductDto> CreateAsync(ProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            CategoryId = dto.CategoryId
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        dto.Id = product.Id;
        return dto;
    }

    public async Task<bool> UpdateAsync(int id, ProductDto dto)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return false;
        p.Name = dto.Name;
        p.Description = dto.Description;
        p.Price = dto.Price;
        p.Stock = dto.Stock;
        p.CategoryId = dto.CategoryId;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return false;
        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return true;
    }
}
