# magentart-mcp (MCPB Bundle)

MCP server for Google Magenta RealTime 2 music generation

## Usage

Add to \claude_desktop_config.json\:
\\\json
{
  "mcpServers": {
    "magentart-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "\D:\Dev\repos", "python", "-m", "magentart_mcp"],
      "env": { "PYTHONPATH": "\D:\Dev\repos/src" }
    }
  }
}
\\\

## Tools

- **magentart_ops**: magentart_ops
- **magentart_agentic_workflow**: magentart_agentic_workflow
- **health**: health

## Requirements

- Python 3.12+
- uv
