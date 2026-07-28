# Per-repo fleet start config for magentart-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'magentart-mcp'
    BackendPort  = 10899
    FrontendPort = 10898
    HealthPath   = '/api/status'
    WebRoot      = 'D:\Dev\repos\magentart-mcp\webapp\frontend'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'main:app'
        WorkDir       = 'D:\Dev\repos\magentart-mcp\webapp\backend'
        SyncExtras    = @('dev')
        Env           = @{ WEB_PORT = '10899' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
        PortEnvVar     = 'VITE_PORT'
        ApiTargetEnv   = 'VITE_API_TARGET'
    }
}
