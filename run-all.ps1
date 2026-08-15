# run-all.ps1 - starts the whole Product Catalog stack with ONE command.
#
# The microservices stay fully separate (each keeps its own port, DB and window):
#   AuthService    -> http://localhost:5001
#   ProductService -> http://localhost:5000
#   Angular frontend (ng serve) -> http://localhost:4200
#
# Usage:
#   .\run-all.ps1          start everything
#   .\run-all.ps1 -Stop    stop everything

param(
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'

$root        = $PSScriptRoot
$authDir     = Join-Path $root 'AuthService'
$productDir  = Join-Path $root 'ProductService'
$frontendDir = Join-Path $root 'Frontend'

if ($Stop) {
    Write-Host 'Stopping Product Catalog (ports 5000, 5001, 4200)...'
    foreach ($port in 4200, 5000, 5001) {
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
    Start-Sleep -Seconds 2
    Write-Host 'Stopped. Close the service windows whenever you like.'
    exit
}

Write-Host '=== Product Catalog - starting everything ==='
Write-Host 'AuthService    -> http://localhost:5001'
Write-Host 'ProductService -> http://localhost:5000'
Write-Host 'Frontend       -> http://localhost:4200'
Write-Host ''

# The JWT signing key must be identical in every microservice, so it is NOT
# committed to each service's appsettings.json (one source of truth instead).
# Set it once here; both AuthService and ProductService read Jwt__Key from the
# environment. For a real deployment, use a proper secret store instead.
$env:Jwt__Key = 'THIS-IS-A-VERY-SECRET-KEY-USE-A-LONG-RANDOM-STRING-32+chars!'

# Start each part in its own console window so logs stay separate.
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$authDir'; dotnet run"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$productDir'; dotnet run"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$frontendDir'; npm start"

# Check whether something is listening on a port (works for IPv4 and IPv6).
function Test-Port([int]$port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $task = $client.ConnectAsync('localhost', $port)
        return $task.Wait(500) -and $client.Connected
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

# Wait for each service to come up. The first ng serve build can be slow,
# so we allow up to 3 minutes.
foreach ($port in 5001, 5000, 4200) {
    $tries = 0
    while (-not (Test-Port $port) -and $tries -lt 180) {
        Start-Sleep -Seconds 1
        $tries++
    }
    if (Test-Port $port) {
        Write-Host "OK  - port $port is up"
    }
    else {
        Write-Host "WARN - port $port did not start after 3 minutes. Check its window."
    }
}

# Open the app in the browser.
Start-Process 'http://localhost:4200'

Write-Host ''
Write-Host 'All started. Log in as admin/Admin@123 or user/User@123.'
Write-Host "To stop everything: .\run-all.ps1 -Stop"
