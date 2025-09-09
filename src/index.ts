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
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/dist/esm/shared/protocol";

async function main() {
    const argv = minimist(process.argv.slice(2));
    const accessKey = argv["access-key"] || process.env.FIREFLY_ACCESS_KEY;
    const secretKey = argv["secret-key"] || process.env.FIREFLY_SECRET_KEY;
    const sse = process.argv.includes("--sse");
    const hosting = process.argv.includes("--hosting");
    const debug = process.argv.includes("debug");
    const port = argv["port"] || 6001;
    const transports: { [sessionId: string]: {transport: SSEServerTransport, fireflyClient: FireflyClient} } = {};
    
    let localFireflyClient: FireflyClient;
    if (!hosting) {
        if (!accessKey || !secretKey) {
            throw new Error("Missing access-key or secret-key");
        }
        localFireflyClient = new FireflyClient(logger, accessKey, secretKey);
        await localFireflyClient.login();
    }

    // MCP server should not write stdout logs as it listens to the stdout. Check if it is changed
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

    // Handle tool requests
    server.setRequestHandler(
        CallToolRequestSchema,
        async (request: CallToolRequest, extra: RequestHandlerExtra) => {
            logger.error("Received CallToolRequest:", request);
            try {
                const toolName = request.params.name;
                const args = request.params.arguments || {};

                let fireflyClient: FireflyClient | null = null;
                if (!hosting) {
                    fireflyClient = localFireflyClient;
                }

                if (hosting && extra.sessionId) {
                    const sessionId = extra.sessionId;
                    const transport = transports[sessionId];
                    if (!transport) {
                        return {
                            content: [{ type: "text", text: JSON.stringify({ error: "No active SSE connection found for sessionId:" + sessionId }) }],
                        };
                    }
                    fireflyClient = transport.fireflyClient;
                }

                if (!fireflyClient) {
                    return {
                        content: [{ type: "text", text: JSON.stringify({ error: "No active SSE connection found" }) }],
                    };
                }

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

    // Hosted server needs to reset every hour to prevent timeout requests and issues connecting to the server
    if (hosting) {
        const app = express();

        app.get("/sse", async (req: express.Request, res: express.Response) => {
            logger.debug("Received connection");

            // Authentication improved since then, this is not best practice
            let basicAuth = null;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Basic ")) {
                basicAuth = authHeader.split(" ")[1];
            }

            if (!basicAuth) {
                basicAuth = req.query.auth as string;
            }

            if (!basicAuth) {
                logger.warn("Authentication failed: Missing or invalid Authorization header.");
                res.status(401).send("Unauthorized");
                return;
            }

            const [accessKey, secretKey] = Buffer.from(basicAuth, "base64").toString().split(":");
            if (!accessKey || !secretKey) {
                logger.warn("Authentication failed: Missing or invalid Authorization header.");
                res.status(401).send("Unauthorized");
                return;
            }

            const transport = new SSEServerTransport("/message", res);
            try {
                const fireflyClient = new FireflyClient(logger, accessKey, secretKey);
                await fireflyClient.login();
                transports[transport.sessionId] = {transport, fireflyClient};
            } catch (error) {
                if (error instanceof Error && error.message.includes("Authentication failed")) {
                    logger.error("Authentication failed:", error);
                    res.status(401).send("Unauthorized");
                    return;
                } 
                logger.error("Error creating FireflyClient:", error);
                res.status(500).send("Internal Server Error");
                return;
            }
            res.on("close", () => {
                delete transports[transport.sessionId];
            });
            await server.connect(transport);
        });

        app.post("/message", async (req: express.Request, res: express.Response) => {
            logger.debug("Received message");
            const sessionId = req.query.sessionId as string;
            const transport = transports[sessionId];
            if (!transport) {
                logger.error("No active SSE connection found for sessionId:", sessionId);
                res.status(404).send("No active SSE connection found");
                return;
            }
            await transport.transport.handlePostMessage(req, res);
        });


        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    } else if (sse) {
        const app = express();

        let transport: SSEServerTransport;

        app.get("/sse", async (req: express.Request, res: express.Response) => {
          logger.debug("Received connection");
          transport = new SSEServerTransport("/message", res);
          await server.connect(transport);
        });
        
        app.post("/message", async (req: express.Request, res: express.Response) => {
          logger.debug("Received message");
        
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