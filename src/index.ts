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
import * as logger from 'loglevel';

async function main() {
    // Parse command line arguments
    const argv = minimist(process.argv.slice(2));
    const accessKey = argv["access-key"] || process.env.FIREFLY_ACCESS_KEY;
    const secretKey = argv["secret-key"] || process.env.FIREFLY_SECRET_KEY;
    const sse = process.argv.includes("--sse");
    const debug = process.argv.includes("debug");
    const port = argv["port"] || 6001;

    if (debug) {
        logger.setLevel(logger.levels.DEBUG, true);
    } else {
        logger.setLevel(logger.levels.SILENT, true);
    }

    logger.info("Starting Firefly MCP Server...");

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
    const fireflyClient = new FireflyClient(logger, accessKey, secretKey);

    // Handle tool requests
    server.setRequestHandler(
        CallToolRequestSchema,
        async (request: CallToolRequest) => {
            logger.error("Received CallToolRequest:", request);
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
                logger.error("Error executing tool:", error);
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
        logger.error("Received ListToolsRequest");
        return {
            tools: [InventoryTool, CodifyTool],
        };
    });

    if (sse) {
        const app = express();

        let transport: SSEServerTransport;

        app.get("/sse", async (req: express.Request, res: express.Response) => {
          logger.info("Received connection");
          transport = new SSEServerTransport("/message", res);
          await server.connect(transport);
        });
        
        app.post("/message", async (req: express.Request, res: express.Response) => {
          logger.info("Received message");
        
          await transport.handlePostMessage(req, res);
        });
        
        
        app.listen(port, () => {
          logger.info(`Server is running on port ${port}`);
        });
    } else {
        // Connect server to Stdio transport
        const transport = new StdioServerTransport();
        logger.info("Connecting server to transport...");
        await server.connect(transport);
        logger.info("Server connected to transport");
    }
}

main().catch((error) => {
    logger.error("Fatal error in main():", error);
    process.exit(1);
});