using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Attributes;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;
using ProductService.Data;
using ProductService.Models;

namespace ProductService.Controllers;

[Authorize]
[ODataAttributeRouting]
public class ProductsODataController : ODataController
{
    private readonly ProductDbContext _db;

    public ProductsODataController(ProductDbContext db) => _db = db;

    private IQueryable<Product> Products => _db.Products.Include(p => p.Category);

    [EnableQuery]
    [HttpGet("odata/Products")]
    public IActionResult Get() => Ok(Products);

    [EnableQuery]
    [HttpGet("odata/Products({key})")]
    public IActionResult Get(int key) => Ok(Microsoft.AspNetCore.OData.Results.SingleResult.Create(Products.Where(p => p.Id == key)));
}
