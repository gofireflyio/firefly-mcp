import {
    Tool,
} from "@modelcontextprotocol/sdk/types.js";

export const InventoryTool: Tool = {
    name: "firefly_inventory",
    description: "Query and filter cloud infrastructure assets across multiple providers. Returns a paginated list of assets matching the specified criteria, with options to filter by type, state, provider, name, ARN, modification date, with or without configuration details.",
    inputSchema: {
        type: "object",
        properties: {
            responseSize: {
                type: "number",
                description: "(Optional) Maximum number of results to return per page. Default is 50. Max is 100000. Use this to control pagination size when retrieving large result sets.",
                default: 50,
            },
            assetTypes: {
                type: "array",
                description: "(Optional) Filter results to specific Terraform resource types. Examples: ['aws_s3_bucket', 'aws_iam_role', 'aws_ec2_instance']. Leave empty to include all asset types.",
                items: {
                    type: "string",
                },
            },
            assetState: {
                type: "string",
                description: "(Optional) Filter assets by their current state in Firefly: 'managed' (fully codified), 'unmanaged' (not yet codified), 'ghost' (deleted but still in code), or 'modified' (drifted from code).",
                enum: ["managed", "unmanaged", "ghost", "modified"],
            },
            providerIds: {
                type: "array",
                description: "(Optional) Filter results to specific cloud provider accounts. Examples: ['123456789012' for AWS, 'my-project-123' for GCP]. Multiple accounts can be specified.",
                items: {
                    type: "string",
                },
            },
            assetNames: {
                type: "array",
                description: "(Optional) Filter results to assets with specific names. Examples: ['my-bucket', 'prod-database']. Supports partial matches.",
                items: {
                    type: "string",
                },
            },
            arns: {
                type: "array",
                description: "(Optional) Filter results to specific ARNs. Examples: ['arn:aws:s3:::my-bucket', 'arn:aws:iam::123456789012:role/my-role']. Useful for precise resource targeting.",
                items: {
                    type: "string",
                },
            },
            modifiedSince: {
                type: "string",
                description: "(Optional) Filter results to assets modified after a specific date. Format: 'YYYY-MM-DD'. Example: '2024-01-01' for assets modified since January 1st, 2024.",
            },
            freeTextSearch: {
                type: "string",
                description: "(Optional) Search across all asset configuration fields. Examples: 'AdministratorAccess' to find IAM roles with this policy, 't3.micro' to find EC2 instances of this type. Supports partial matches and multiple terms.",
            },
            includeConfigration: {
                type: "boolean",
                description: "(Optional) When true, includes detailed configuration data for each asset in the response. Useful for detailed analysis but increases response size. Default is false for better performance. The configuration data can be used to generate the IaC for the asset.",
                default: false,
            },
        },
    },
};

export const CodifyTool: Tool = {
    name: "firefly_codify",
    description: "Generate Terraform import commands and configuration for a specific cloud resource. This tool helps you codify existing infrastructure by providing the necessary Terraform commands and resource definitions to bring the resource under Terraform management.",
    inputSchema: {
        type: "object",
        properties: {
            assetType: {
                type: "string",
                description: "The Terraform resource type identifier. Examples: 'aws_s3_bucket' for S3 buckets, 'aws_iam_role' for IAM roles, 'aws_ec2_instance' for EC2 instances. Must match the exact Terraform resource type name.",
            },
            assetId: {
                type: "string",
                description: "The unique identifier of the resource. This is typically the full ARN (e.g., 'arn:aws:s3:::my-bucket' for S3, 'arn:aws:iam::123456789012:role/my-role' for IAM).",
            },
            iacType: {
                type: "string",
                description: "The Infrastructure as Code framework to use. This determines the format of the generated import commands and configuration.",
                default: "terraform",
            },
            provider: {
                type: "string",
                description: "The cloud provider where the resource exists. Use 'aws' for Amazon Web Services, 'azure' for Microsoft Azure, 'gcp' for Google Cloud Platform. Must be lowercase.",
            },
            accountNumber: {
                type: "string",
                description: "The cloud provider account identifier. For AWS, this is the 12-digit account number (e.g., '123456789012'). For GCP, use the project ID. For Azure, use the subscription ID.",
            }
        },
        required: ["assetType", "assetId", "iacType", "provider", "accountNumber"],
    },
};