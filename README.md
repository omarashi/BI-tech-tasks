# Product Catalog — Secure Microservices API

A secure **ASP.NET Core 8** product catalog built as two independent microservices with JWT authentication, OData querying, RESTful CRUD, and custom middleware, plus an Angular web UI.

## Architecture

| Project | Port | Purpose |
|---|---|---|
| `AuthService` | 5001 | Login, verifies passwords, issues JWT tokens |
| `ProductService` | 5000 | Product catalog — REST CRUD + OData + custom middleware |
| `Shared` | — | DTOs shared between the services |
| `Frontend` | 4200 | Angular web UI — login, product & category management |

Each service owns its own SQLite database (`auth.db`, `product.db`) and runs independently.

## Requirements coverage

- **RESTful CRUD** — `ProductService/Controllers/ProductsController.cs` + `CategoriesController.cs` (`GET`, `GET/{id}`, `POST`, `PUT`, `DELETE`)
- **OData endpoints** — `ProductService/Controllers/ProductsODataController.cs` + `CategoriesODataController.cs` (`$filter`, `$orderby`, `$top`, `$select`, `$expand`)
- **Custom middleware** — `ProductService/Middleware/RequestLoggingMiddleware.cs` logs every request
- **JWT authentication & authorization** — AuthService issues tokens; ProductService validates them and enforces roles (`Admin` vs `User`)
- **Microservice architecture** — two independently deployable services, separate ports and databases
- **Web UI** — `Frontend/` Angular app for login, product and category management

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm (for the Angular frontend)

## How to run

Both services sign/validate JWTs with a shared signing key, so set the `Jwt__Key`
environment variable (at least 32 chars) in every terminal first:

```powershell
$env:Jwt__Key = 'use-a-long-random-string-of-at-least-32-characters'
```

Then run each service in its own terminal window.

Terminal 1:
```
cd AuthService
dotnet run
```

Terminal 2:
```
cd ProductService
dotnet run
```

Terminal 3 (frontend):
```
cd Frontend
npm install
npm start
```

Wait for all to print `Now listening on: ...` before testing. The app is at `http://localhost:4200`.

Quickest way — `.\run-all.ps1` starts AuthService, ProductService and the Angular
frontend with one command and sets the key for you.
Stop everything with `.\run-all.ps1 -Stop`.

## Test credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | Admin — full access |
| `user` | `User@123` | User — read-only |

## Test it

Quickest way — one script that logs in and exercises everything:
```
& ".\test.ps1"
```

Or step by step in PowerShell:

```powershell
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:5001/api/auth/login' -ContentType 'application/json' -Body '{"username":"admin","password":"Admin@123"}'
$h = @{ Authorization = "Bearer $($login.token)" }

Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/api/products' -Headers $h
```

## Endpoints

### REST (Swagger: `http://localhost:5000/swagger`)

| Method | Route | Access |
|---|---|---|
| `GET` | `/api/products` | Any authenticated user |
| `GET` | `/api/products/{id}` | Any authenticated user |
| `POST` | `/api/products` | Admin only |
| `PUT` | `/api/products/{id}` | Admin only |
| `DELETE` | `/api/products/{id}` | Admin only |
| `GET` | `/api/categories` | Any authenticated user |
| `POST` | `/api/categories` | Admin only |
| `PUT` | `/api/categories/{id}` | Admin only |
| `DELETE` | `/api/categories/{id}` | Admin only |

### OData (`http://localhost:5000/odata/...`, also JWT-protected)

```
/odata/Products?$filter=Price lt 30
/odata/Products?$orderby=Name
/odata/Products?$top=3
/odata/Products?$select=Name,Price
/odata/Categories
```

The OData routes also appear in Swagger under an **OData** section (added via a custom Swagger document filter in `ProductService/Swagger/ODataSwaggerFilter.cs`), so you can try them from the UI too. Remember to authorize with the Bearer token first.

## Security notes

- The JWT key in `run-all.ps1` is a **development placeholder**.
- For real deployments, override it with the `Jwt__Key` environment variable and never commit a real secret.
- Login and registration are rate-limited (20 requests / 5 minutes per IP).
- Passwords are stored as password hashes (via `PasswordHasher`), never in plaintext.
