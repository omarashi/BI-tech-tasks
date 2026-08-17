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

- **RESTful writes** — `ProductService/Controllers/ProductsController.cs` + `CategoriesController.cs` (`POST`, `PUT`, `DELETE`); all reads go through the OData controllers
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

Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/odata/Products' -Headers $h
```

## Endpoints

### REST writes

| Method | Route | Access |
|---|---|---|
| `POST` | `/api/products` | Admin only |
| `PUT` | `/api/products/{id}` | Admin only |
| `DELETE` | `/api/products/{id}` | Admin only |
| `POST` | `/api/categories` | Admin only |
| `PUT` | `/api/categories/{id}` | Admin only |
| `DELETE` | `/api/categories/{id}` | Admin only |

All reads go through the OData endpoints below (single-product lookup: `/odata/Products({id})?$expand=Category`).

### OData (`http://localhost:5000/odata/...`, also JWT-protected)

```
/odata/Products?$filter=Price lt 30
/odata/Products?$orderby=Name
/odata/Products?$top=3
/odata/Products?$select=Name,Price
/odata/Products(1)?$expand=Category
/odata/Categories
```

All requests must be authenticated with a Bearer token.

## Frontend architecture

The Angular 22 frontend lives in `Frontend/` and uses standalone components (no `NgModule`), signals for reactive state, and the new `@if`/`@for` control flow syntax.

| Folder | Purpose |
|---|---|
| `src/app/services/` | HTTP clients wrapping `HttpClient` — `catalog.service.ts` (all catalog calls) and `auth.service.ts` (login, token storage) |
| `src/app/interceptors/` | `jwt.interceptor.ts` — attaches `Authorization: Bearer` to every outgoing request; `http-error.interceptor.ts` — catches 401 errors, clears session, redirects to login |
| `src/app/guards/` | `authGuard` — blocks unauthenticated navigation; `adminGuard` — blocks non-admin users from write pages |
| `src/app/models/` | TypeScript interfaces mirroring the C# DTOs (`Product`, `Category`, `User`, `OData*`) |
| `src/app/shared/` | `api-urls.ts` (environment-based base URLs), `http-error.ts` (user-friendly error messages) |
| `src/app/pages/` | Routed view components: `login`, `products`, `product-detail`, `product-form`, `categories` |

### Frontend ↔ Backend communication

- **Reads** go through OData endpoints (`GET /odata/Products?$filter=...&$expand=Category`), giving the frontend flexible query power (filtering, sorting, pagination, column projection) with zero per-query backend code.
- **Writes** go through REST endpoints (`POST/PUT/DELETE /api/products`, `/api/categories`), which enforce Admin-only authorization.
- All requests carry a JWT Bearer token (auto-attached by the interceptor). The token is stored in `localStorage` with three keys: `auth_token`, `auth_role`, `auth_user`.

### Design patterns

| Pattern | Where | Purpose |
|---|---|---|
| Microservice / service-per-domain | Solution layout | Independent deployment, separate databases, clear ownership |
| MVC (Controller-based REST) | `Controllers/` + `Models/` | HTTP layer separated from business logic |
| Service layer | `Services/CatalogService.cs` | Encapsulates business rules, keeps controllers thin |
| DTO (Data Transfer Object) | `Shared/*.Dto.cs` | Decouples wire format from internal EF entities |
| Result object | `Shared/ServiceResult.cs` | Methods return `ServiceResult<T>` instead of throwing on expected failures |
| Dependency Injection | `Program.cs` + constructors | All services wired through ASP.NET Core / Angular DI containers |
| Pipeline/Middleware | `RequestLoggingMiddleware`, Angular interceptors | Cross-cutting concerns (logging, auth, error handling) |
| Route guards | `guards/auth.guard.ts` | Prevents unauthorized navigation before the page loads |
| Server-side pagination | `$top/$skip/$count` | Only one page of data held in the frontend at a time |
| Integer-cents money storage | `ProductDbContext` | `decimal Price` stored as `int (price * 100)` to avoid floating-point precision issues |

## Security notes

- The JWT key in `run-all.ps1` is a **development placeholder**.
- For real deployments, override it with the `Jwt__Key` environment variable and never commit a real secret.
- Login and registration are rate-limited (20 requests / 5 minutes per IP).
- Passwords are stored as password hashes (via `PasswordHasher`), never in plaintext.
- JWT tokens expire after 1 hour; the frontend catches 401 responses and redirects to login automatically.
