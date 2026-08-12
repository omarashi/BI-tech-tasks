using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ProductService.Swagger;

public class ODataSwaggerFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument doc, DocumentFilterContext context)
    {
        var odataParams = new List<OpenApiParameter>
        {
            Query("$filter", "Filter results (e.g. Price lt 30)"),
            Query("$orderby", "Sort results (e.g. Name, Price desc)"),
            Query("$top", "Limit results", "integer"),
            Query("$skip", "Skip results", "integer"),
            Query("$select", "Select properties (e.g. Name,Price)"),
            Query("$expand", "Expand navigation (e.g. Category)")
        };

        doc.Paths.TryAdd("/odata/Products", new OpenApiPathItem
        {
            Operations =
            {
                [OperationType.Get] = ODataOperation("Get products", odataParams)
            }
        });

        doc.Paths.TryAdd("/odata/Products({key})", new OpenApiPathItem
        {
            Operations =
            {
                [OperationType.Get] = ODataOperation("Get a product by key", odataParams, withKey: true)
            }
        });

        doc.Paths.TryAdd("/odata/Categories", new OpenApiPathItem
        {
            Operations =
            {
                [OperationType.Get] = ODataOperation("Get categories", odataParams)
            }
        });
    }

    private static OpenApiParameter Query(string name, string desc, string type = "string") => new()
    {
        Name = name,
        In = ParameterLocation.Query,
        Description = desc,
        Required = false,
        Schema = new OpenApiSchema { Type = type }
    };

    private static OpenApiOperation ODataOperation(string summary, List<OpenApiParameter> odataParams, bool withKey = false)
    {
        var parameters = new List<OpenApiParameter>();
        if (withKey)
        {
            parameters.Add(new OpenApiParameter
            {
                Name = "key",
                In = ParameterLocation.Path,
                Required = true,
                Schema = new OpenApiSchema { Type = "integer" }
            });
        }
        parameters.AddRange(odataParams);

        return new OpenApiOperation
        {
            Summary = summary,
            Tags = new List<OpenApiTag> { new() { Name = "OData" } },
            Parameters = parameters,
            Responses = new OpenApiResponses
            {
                ["200"] = new OpenApiResponse { Description = "Success" },
                ["401"] = new OpenApiResponse { Description = "Unauthorized" }
            }
        };
    }
}
