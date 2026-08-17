Write-Host "=== Product Catalog Test Script ==="
Write-Host "1) Admin  (can create/update/delete products)"
Write-Host "2) User   (read-only)"
$choice = Read-Host "Choose 1 or 2"

if ($choice -eq "2") {
    $user = "user"
    $pass = "User@123"
    $role = "User"
} else {
    $user = "admin"
    $pass = "Admin@123"
    $role = "Admin"
}

Write-Host "`nLogging in as $role..."
$body = @{ username = $user; password = $pass } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:5001/api/auth/login' -ContentType 'application/json' -Body $body
$h = @{ Authorization = "Bearer $($login.token)" }
Write-Host "   Got token: $($login.token.Substring(0, 25))...`n"

Write-Host "1) OData - GET /odata/Products (list, with token):"
$products = Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/odata/Products' -Headers $h
$products.value | ConvertTo-Json -Depth 5

Write-Host "`n2) OData - /odata/Products?`$filter=Price lt 30 (with token):"
$cheap = Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/odata/Products?$filter=Price lt 30' -Headers $h
$cheap.value | ConvertTo-Json -Depth 5

Write-Host "`n3) OData - /odata/Categories (with token):"
$cats = Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/odata/Categories' -Headers $h
$cats.value | ConvertTo-Json -Depth 5

Write-Host "`n4) POST /api/products (create) - expect 200 for Admin, 403 for User:"
try {
    $created = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/products' -Headers $h -ContentType 'application/json' -Body '{"name":"Temp Test","price":5.00,"stock":1,"categoryId":1}'
    Write-Host "   Created product id=$($created.Id) - this role has write access"
} catch {
    Write-Host "   Got $($_.Exception.Response.StatusCode.value__) - this role cannot create products"
}

Write-Host "`n5) Security check - GET /odata/Products WITHOUT token (should fail):"
try {
    Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/odata/Products' -ErrorAction Stop
    Write-Host "   ERROR: it worked without a token (bad!)"
} catch {
    Write-Host "   Got $($_.Exception.Response.StatusCode.value__) - access denied as expected (good!)"
}
Write-Host "`nDone!"
