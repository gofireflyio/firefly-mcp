[![Firefly](https://infralight-templates-public.s3.amazonaws.com/company-logos/firefly_logo_white.png)](https://firefly.ai)

# Firefly MCP Server

The Firefly MCP (Management Control Protocol) server is a TypeScript-based server that enables seamless integration with the Firefly platform. It allows you to discover, manage, and codify resources across your Cloud and SaaS accounts connected to Firefly.

## Features

- 🔍 Resource Discovery: Find any resource in your Cloud and SaaS accounts
- 📝 Resource Codification: Convert discovered resources into Infrastructure as Code
- 🔐 Secure Authentication: Uses FIREFLY_ACCESS_KEY and FIREFLY_SECRET_KEY for secure communication
- 🚀 Easy Integration: Works seamlessly with Claude and Cursor

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firefly account with generated access keys

## Installation

You can run the Firefly MCP server directly using NPX:

```bash
npx @fireflyai/firefly-mcp
```

### Environment Variables

You can provide your Firefly credentials in two ways:

1. Using environment variables:
```bash
FIREFLY_ACCESS_KEY=your_access_key FIREFLY_SECRET_KEY=your_secret_key npx @fireflyai/firefly-mcp
```

2. Using arguments:
```bash
npx @fireflyai/firefly-mcp --access-key your_access_key --secret-key your_secret_key
```

## Usage

### Stdio

Update the `mcp.json` file with the following:  
```bash
{
  "mcpServers": {
    "firefly": {
      "command": "npx",
      "args": ["-y", "@fireflyai/firefly-mcp"],
      "env": {
        "FIREFLY_ACCESS_KEY": "your_access_key",
        "FIREFLY_SECRET_KEY": "your_secret_key"
      }
    }
  }
}
```

Run the MCP server using one of the methods above with the following command:
```bash
npx @fireflyai/firefly-mcp --sse --port 6001
```

Update the `mcp.json` file with the following:
```bash
{
  "mcpServers": {
    "firefly": {
      "url": "http://localhost:6001/sse"
    }
  }
}
```

### Using with Cursor

1. Start the MCP server using one of the methods above
2. Use the Cursor extension to connect to the MCP server - see [Cursor Model Context Protocol documentation](https://docs.cursor.com/context/model-context-protocol)
3. Use natural language to query your resources

#### Example:

##### Prompt 
```
Find all "ubuntu-prod" EC2 instance in 123456789012 AWS account and codify it into Terraform
```

##### Response
```
resource "aws_instance" "ubuntu-prod" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}
```

## Demo

[Placeholder for GIF showing the MCP server in action]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please visit [Firefly's documentation](https://firefly.ai/docs) or create an issue in this repository.
