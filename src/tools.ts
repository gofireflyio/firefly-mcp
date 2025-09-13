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

export const GetPolicesTool: Tool = {
    name: "firefly_get_policies",
    description: "Retrieves Firefly Governance policies with optional filtering and field projection. Policies help identify security risks, compliance issues, and best practice violations across your cloud infrastructure.",
    inputSchema: {
        type: "object",
        properties: {
            fields: {
                type: "string",
                description: "(Optional) Comma-separated list of fields to include in the response. Example: 'id,name,description,status'",
            },
            query: {
                type: "string",
                description: "(Optional) Search query string to filter policies",
            },
            labels: {
                type: "array",
                description: "(Optional) Array of labels for filtering policies. Examples: ['security', 'compliance']",
                items: {
                    type: "string",
                },
            },
            frameworks: {
                type: "array",
                description: "(Optional) Array of compliance framework filters. Available frameworks: 'CIS', 'Cloud Waste', 'EOL', 'HIPAA', 'NIST', 'PCI DSS', 'SOC 2'. Examples: ['CIS', 'HIPAA', 'NIST']",
                items: {
                    type: "string",
                },
            },
            category: {
                type: "string",
                description: "(Optional) Category filter. Examples: 'Misconfiguration', 'Security', 'Optimization'",
            },
            isDefault: {
                type: "boolean",
                description: "(Optional) Filter for default policies only",
            },
            onlySubscribed: {
                type: "boolean",
                description: "(Optional) Filter for notificaitons subscribed policies only. Default: false",
            },
            onlyProduction: {
                type: "boolean",
                description: "(Optional) Filter for production policies only. Default: false",
            },
            onlyMatchingAssets: {
                type: "boolean",
                description: "(Optional) Filter for policies with matching assets only. Default: false",
            },
            onlyEnabled: {
                type: "boolean",
                description: "(Optional) Filter for enabled policies only. Default: false",
            },
            onlyAvailableProviders: {
                type: "boolean",
                description: "(Optional) Filter for available providers only. Default: true",
            },
            showExclusion: {
                type: "boolean",
                description: "(Optional) Show exclusion rules. Default: false",
            },
            type: {
                type: "array",
                description: "(Optional) Array of policy asset types. Examples: ['aws_cloudwatch_event_target'], ['aws_ebs_volume']",
                items: {
                    type: "string",
                },
            },
            providers: {
                type: "array",
                description: "(Optional) Array of provider filters",
                items: {
                    type: "string",
                },
            },
            integrations: {
                type: "array",
                description: "(Optional) Array of integration filters",
                items: {
                    type: "string",
                },
            },
            severity: {
                type: "array",
                description: "(Optional) Array of severity filters (integers: 1=low, 2=medium, 3=high, 4=critical)",
                items: {
                    type: "number",
                },
            },
            id: {
                type: "array",
                description: "(Optional) Array of specific policy ID filters. Example: ['665088e83438d32bdda77193']",
                items: {
                    type: "string",
                },
            },
            page: {
                type: "number",
                description: "(Optional) Page number for pagination. Default is 1. Minimum: 1",
                minimum: 1,
                default: 1,
            },
            page_size: {
                type: "number",
                description: "(Optional) Number of items per page. Default is 50. Minimum: 1",
                minimum: 1,
                default: 50,
            },
            sorting: {
                type: "array",
                description: "(Optional) Array of sorting criteria",
                items: {
                    type: "string",
                },
            },
            providersAccounts: {
                type: "array",
                description: "(Optional) Array of provider account filters. Examples: ['awsobjects', 'k8sobjects', 'gcpobjects', 'azurermobjects']. Available providers: 'awsobjects', 'k8sobjects', 'akamaiobjects', 'datadogobjects', 'oktaobjects', 'githubobjects', 'newrelicobjects', 'cloudflareobjects', 'gcpobjects', 'pagerdutyobjects', 'mongodbatlasobjects', 'azurermobjects', 'aws', 'kubernetes', 'akamai', 'datadog', 'okta', 'github', 'newrelic', 'cloudflare', 'google', 'pagerduty', 'mongodbatlas', 'azurerm'",
                items: {
                    type: "string",
                },
            },
        },
    },
};

export const CreatePolicyTool: Tool = {
    name: "firefly_create_policy",
    description: "Creates a new custom Governance policy with Rego rules. Use this to define custom policies for your organization's specific compliance and security requirements.",
    inputSchema: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Name of the policy. Should be descriptive and unique. Example: 'S3 Buckets Without Encryption'",
            },
            description: {
                type: "string",
                description: "(Optional) Description of what this policy checks and why it's important.",
            },
            code: {
                type: "string",
                description: "Rego code for the policy rule (can be base64 encoded). Example: 'ZmlyZWZseSB7CiAgICBtYXRjaAp9...'",
            },
            type: {
                type: "array",
                description: "Array of policy asset types. Examples: ['aws_cloudwatch_event_target'], ['aws_ebs_volume']",
                items: {
                    type: "string",
                },
            },
            providerIds: {
                type: "array",
                description: "Array of provider IDs this policy applies to. Examples: ['aws_all', '6416a2dbf4012fc0bab0463f']",
                items: {
                    type: "string",
                },
            },
            labels: {
                type: "array",
                description: "(Optional) Array of labels for the policy. Examples: ['security', 'compliance']",
                items: {
                    type: "string",
                },
            },
            severity: {
                type: "number",
                description: "(Optional) Severity level as integer: 1=low, 2=medium, 3=high, 4=critical",
                minimum: 1,
                maximum: 4,
            },
            category: {
                type: "string",
                description: "(Optional) Category of the policy. Example: 'Misconfiguration'",
            },
            frameworks: {
                type: "array",
                description: "(Optional) Array of compliance frameworks this policy relates to. Available: 'CIS', 'Cloud Waste', 'EOL', 'HIPAA', 'NIST', 'PCI DSS', 'SOC 2'. Examples: ['CIS', 'HIPAA']",
                items: {
                    type: "string",
                },
            },
        },
        required: ["name", "code", "type", "providerIds"],
    },
};

export const UpdatePolicyTool: Tool = {
    name: "firefly_update_policy",
    description: "Updates an existing Governance policy configuration. Use this to modify custom policies, update Rego rules, or change policy metadata.",
    inputSchema: {
        type: "object",
        properties: {
            id: {
                type: "string",
                description: "The unique identifier of the policy to update.",
            },
            name: {
                type: "string",
                description: "The updated name of the policy.",
            },
            code: {
                type: "string",
                description: "The updated Rego rule code that defines the policy logic.",
            },
            type: {
                type: "array",
                description: "The updated types of policy as an array.",
                items: {
                    type: "string",
                },
            },
            providerIds: {
                type: "array",
                description: "Updated list of cloud provider account identifiers where this policy should be applied.",
                items: {
                    type: "string",
                },
            },
            description: {
                type: "string",
                description: "(Optional) Updated description of the policy.",
            },
            severity: {
                type: "number",
                description: "(Optional) Updated severity level as integer: 1=low, 2=medium, 3=high, 4=critical",
                minimum: 1,
                maximum: 4,
            },
            labels: {
                type: "array",
                description: "(Optional) Updated labels/tags for the policy.",
                items: {
                    type: "string",
                },
            },
            category: {
                type: "string",
                description: "(Optional) Updated category of the policy. Example: 'Misconfiguration'",
            },
            frameworks: {
                type: "array",
                description: "(Optional) Updated array of compliance frameworks this policy relates to. Available: 'CIS', 'Cloud Waste', 'EOL', 'HIPAA', 'NIST', 'PCI DSS', 'SOC 2'. Examples: ['CIS', 'SOC 2']",
                items: {
                    type: "string",
                },
            },
        },
        required: ["id", "name", "code", "type", "providerIds"],
    },
};

export const DeletePolicyTool: Tool = {
    name: "firefly_delete_policy",
    description: "Deletes a specific Governance policy by ID. Use this to remove custom policies that are no longer needed.",
    inputSchema: {
        type: "object",
        properties: {
            id: {
                type: "string",
                description: "The unique identifier of the policy to delete.",
            },
        },
        required: ["id"],
    },
};