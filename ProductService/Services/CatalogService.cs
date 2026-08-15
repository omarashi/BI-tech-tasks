using Microsoft.EntityFrameworkCore;
using ProductService.Data;
using ProductService.Models;
using Shared;

namespace ProductService.Services;

public interface ICatalogService
{
    Task<List<ProductDto>> GetProductsAsync();
    Task<ProductDto?> GetProductAsync(int id);
    Task<ProductDto> CreateProductAsync(ProductDto dto);
    Task<bool> UpdateProductAsync(int id, ProductDto dto);
    Task<bool> DeleteProductAsync(int id);

    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> CreateCategoryAsync(CategoryDto dto);
    Task<ServiceResult<CategoryDto>> UpdateCategoryAsync(int id, CategoryDto dto);
    Task<ServiceResult> DeleteCategoryAsync(int id);
}

public class CatalogService : ICatalogService
{
    private readonly ProductDbContext _db;

    public CatalogService(ProductDbContext db) => _db = db;

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

    private static CategoryDto ToDto(Category c) => new() { Id = c.Id, Name = c.Name };

    public async Task<List<ProductDto>> GetProductsAsync()
    {
        var products = await _db.Products.AsNoTracking().Include(p => p.Category).ToListAsync();
        return products.Select(p => ToDto(p)).ToList();
    }

    public async Task<ProductDto?> GetProductAsync(int id)
    {
        var p = await _db.Products.AsNoTracking().Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        return p == null ? null : ToDto(p);
    }

    public async Task<ProductDto> CreateProductAsync(ProductDto dto)
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

    public async Task<bool> UpdateProductAsync(int id, ProductDto dto)
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

    public async Task<bool> DeleteProductAsync(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return false;
        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _db.Categories.AsNoTracking().OrderBy(c => c.Id).ToListAsync();
        return categories.Select(ToDto).ToList();
    }

    public async Task<CategoryDto> CreateCategoryAsync(CategoryDto dto)
    {
        var category = new Category { Name = dto.Name };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        dto.Id = category.Id;
        return dto;
    }

    public async Task<ServiceResult<CategoryDto>> UpdateCategoryAsync(int id, CategoryDto dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return ServiceResult<CategoryDto>.Missing();

        category.Name = dto.Name;
        await _db.SaveChangesAsync();
        return ServiceResult<CategoryDto>.Ok(new CategoryDto { Id = category.Id, Name = category.Name });
    }

    public async Task<ServiceResult> DeleteCategoryAsync(int id)
    {
        var category = await _db.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return ServiceResult.Missing();

        if (category.Products.Count > 0)
            return ServiceResult.Fail("This category still has products. Move or delete them first.");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return ServiceResult.Ok();
    }
}
