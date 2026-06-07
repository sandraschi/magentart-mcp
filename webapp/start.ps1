Param([switch]$Headless)

# --- SOTA Headless Standard ---
if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }
# ------------------------------

# start.ps1 â€” Magenta RT Webapp launcher
# Ports: Frontend 10898, Backend 10899
$ErrorActionPreference = "Stop"
$FrontPort = 10898
$BackPort  = 10899
$Root      = $PSScriptRoot

Write-Host "=== Magenta RT Webapp ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:$FrontPort" -ForegroundColor Green
Write-Host "Backend:  http://localhost:$BackPort"  -ForegroundColor Green

# Kill any zombies on our ports
foreach ($port in @($FrontPort, $BackPort)) {
    $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    foreach ($id in $pids) {
        if ($id) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
    }
}

# --- Environment ---
$VenvDir = "$Root\..\.venv"
$PythonExe = "$VenvDir\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "Venv not found at $VenvDir. Running uv sync..." -ForegroundColor Yellow
    Set-Location "$Root\.."
    uv sync
    Set-Location $Root
}

# Verifying critical backend deps
Write-Host "Verifying backend dependencies..." -ForegroundColor Yellow
& $PythonExe -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing missing web dependencies..." -ForegroundColor Yellow
    & $PythonExe -m pip install fastapi uvicorn --quiet
}

# --- Backend ---
Write-Host "Starting backend on :$BackPort..." -ForegroundColor Yellow
$BackendJob = Start-Job -ScriptBlock {
    param($python, $backdir, $port)
    Set-Location $backdir
    & $python -m uvicorn main:app --host 0.0.0.0 --port $port --no-access-log
} -ArgumentList $PythonExe, "$Root\backend", $BackPort

# --- Frontend ---
Write-Host "Starting frontend on :$FrontPort..." -ForegroundColor Yellow
$FrontendJob = Start-Job -ScriptBlock {
    param($frontdir, $port)
    Set-Location $frontdir
    if (-not (Test-Path "node_modules")) {
        npm install --silent
    }
    npm run dev -- --port $port
} -ArgumentList "$Root\frontend", $FrontPort

# Wait and relay output
Start-Sleep -Seconds 5
Write-Host ""
Write-Host "App running. Open http://localhost:$FrontPort" -ForegroundColor Green

