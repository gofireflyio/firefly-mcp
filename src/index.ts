#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequest,
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import minimist from 'minimist';
import { FireflyClient, InventoryArgs, CodifyArgs } from './fireflyClient';
import { InventoryTool, CodifyTool } from './tools';
import express from 'express';

async function main() {
    console.error("Starting Firefly MCP Server...");

    // Parse command line arguments
    const argv = minimist(process.argv.slice(2));
    const accessKey = argv["access-key"] || process.env.FIREFLY_ACCESS_KEY;
    const secretKey = argv["secret-key"] || process.env.FIREFLY_SECRET_KEY;
    const sse = process.argv.includes("sse");
    const port = argv["port"] || 6001;

    // Create MCP server
    const server = new Server(
        {
            name: "Firefly MCP Server",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {
                    inventoryTool: InventoryTool,
                    codifyTool: CodifyTool,
                },
            },
        },
    );

    // Create Firefly client
    const fireflyClient = new FireflyClient(accessKey, secretKey);

    // Handle tool requests
    server.setRequestHandler(
        CallToolRequestSchema,
        async (request: CallToolRequest) => {
            console.error("Received CallToolRequest:", request);
            try {
                const toolName = request.params.name;
                const args = request.params.arguments || {};

                switch (toolName) {
                    case "firefly_inventory": {
                        const inventoryArgs = args as unknown as InventoryArgs;
                        const response = await fireflyClient.inventory(inventoryArgs);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }

                    case "firefly_codify": {
                        const codifyArgs = args as unknown as CodifyArgs;
                        if (!codifyArgs.assetType || !codifyArgs.assetId || !codifyArgs.iacType ||
                            !codifyArgs.provider || !codifyArgs.accountNumber) {
                            throw new Error("Missing required arguments for codification");
                        }
                        const response = await fireflyClient.codify(codifyArgs);
                        return {
                            content: [{ type: "text", text: JSON.stringify(response) }],
                        };
                    }

                    default:
                        throw new Error(`Unknown tool: ${toolName}`);
                }
            } catch (error) {
                console.error("Error executing tool:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: error instanceof Error ? error.message : String(error),
                            }),
                        },
                    ],
                };
            }
        },
    );

    // Handle tool listing
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        console.error("Received ListToolsRequest");
        return {
            tools: [InventoryTool, CodifyTool],
        };
    });

    if (sse) {
        const app = express();

        let transport: SSEServerTransport;

        app.get("/sse", async (req: express.Request, res: express.Response) => {
          console.log("Received connection");
          transport = new SSEServerTransport("/message", res);
          await server.connect(transport);
        });
        
        app.post("/message", async (req: express.Request, res: express.Response) => {
          console.log("Received message");
        
          await transport.handlePostMessage(req, res);
        });
        
        
        app.listen(port, () => {
          console.log(`Server is running on port ${port}`);
        });
    } else {
        // Connect server to Stdio transport
        const transport = new StdioServerTransport();
        console.error("Connecting server to transport...");
        await server.connect(transport);
        console.error("Server connected to transport");
    }
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});