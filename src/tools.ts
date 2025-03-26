import {
    Tool,
} from "@modelcontextprotocol/sdk/types.js";

export const InventoryTool: Tool = {
    name: "firefly_inventory",
    description: "Run inventory query over asset types and asset states",
    inputSchema: {
        type: "object",
        properties: {
            pageNumber: {
                type: "number",
                description: "Page number requested. Each page holds 50 results.",
                default: 1,
            },
            assetType: {
                type: "string",
                description: "(Optional) Terraform asset type query filter (e.g., aws_s3_bucket, aws_instance)",
            },
            assetState: {
                type: "string",
                description: "(Optional) Firefly asset state query filter",
                enum: ["managed", "unmanaged", "ghost", "modified"],
            },
            modifiedSince: {
                type: "string",
                description: "(Optional) Return assets modified since provided date in YYYY-MM-DD format",
                format: "date",
            },
        },
    },
};

export const CodifyTool: Tool = {
    name: "firefly_codify",
    description: "Codify a specific resource and get the Terraform import command",
    inputSchema: {
        type: "object",
        properties: {
            assetType: {
                type: "string",
                description: "The terraform asset type of the resource (e.g., aws_s3_bucket)",
            },
            assetId: {
                type: "string",
                description: "The ID of the resource to codify",
            },
            iacType: {
                type: "string",
                description: "Infrastructure as Code type (e.g., terraform)",
                default: "terraform",
            },
            provider: {
                type: "string",
                description: "Cloud provider (e.g., aws, azure, gcp)",
            },
            accountNumber: {
                type: "string",
                description: "The account number where the resource exists",
            },
            codificationMode: {
                type: "string",
                description: "Codification mode",
            },
        },
        required: ["assetType", "assetId", "iacType", "provider", "accountNumber"],
    },
};