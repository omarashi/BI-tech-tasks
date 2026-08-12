using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Attributes;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using ProductService.Data;

namespace ProductService.Controllers;

[Authorize]
[ODataAttributeRouting]
public class CategoriesODataController : ODataController
{
    private readonly ProductDbContext _db;

    public CategoriesODataController(ProductDbContext db) => _db = db;

    [EnableQuery]
    [HttpGet("odata/Categories")]
    public IActionResult Get() => Ok(_db.Categories.AsQueryable());
}
