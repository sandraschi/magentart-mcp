# Per-repo fleet start config for magentart-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'magentart-mcp'
    BackendPort  = 10899
    FrontendPort = 10898
    HealthPath   = '/api/status'
    WebRoot      = 'webapp\frontend'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'main:app'
        WorkDir       = 'webapp\backend'
        SyncExtras    = @('dev')
        SyncOnStart   = $true
        Env           = @{ WEB_PORT = '10899' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
    }
}
