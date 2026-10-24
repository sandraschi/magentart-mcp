# Per-repo fleet start config for magentart-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'magentart-mcp'
    BackendPort  = 10899
    FrontendPort = 10898
    HealthPath   = '/health'
    WebRoot      = 'webapp\frontend'
    Backend = @{
        Kind = 'none'
    }
    Frontend = @{
        Kind = 'none'
    }
}
