import {
    Tool,
} from "@modelcontextprotocol/sdk/types.js";

export const InventoryTool: Tool = {
    name: "firefly_inventory",
    description: "Run inventory query over asset types and asset states",
    inputSchema: {
        type: "object",
        properties: {
            responseSize: {
                type: "number",
                description: "Number of results to return. Each page holds 50 results.",
                default: 50,
            },
            assetTypes: {
                type: "array",
                description: "(Optional) Terraform asset types query filter (e.g., aws_s3_bucket, aws_instance)",
                items: {
                    type: "string",
                },
            },
            assetState: {
                type: "string",
                description: "(Optional) Firefly asset state query filter",
                enum: ["managed", "unmanaged", "ghost", "modified"],
            },
            providerIds: {
                type: "array",
                description: "(Optional) Provider IDs (e.g., aws account number, gcp project id) to filter by",
                items: {
                    type: "string",
                },
            },
            assetNames: {
                type: "array",
                description: "(Optional) Asset names to filter by",
                items: {
                    type: "string",
                },
            },
            arns: {
                type: "array",
                description: "(Optional) ARNs to filter by",
                items: {
                    type: "string",
                },
            },
            modifiedSince: {
                type: "string",
                description: "(Optional) Modified since date (e.g., 2024-01-01)",
            },
            freeTextSearch: {
                type: "string",
                description: "(Optional) Free text search query value in the assets configuration for searches across all fields (e.g., 'AdministratorAccess', 't3.micro')",
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
            }
        },
        required: ["assetType", "assetId", "iacType", "provider", "accountNumber"],
    },
};