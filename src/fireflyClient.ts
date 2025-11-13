interface LoginArgs {
    accessKey?: string;
    secretKey?: string;
}

export interface InventoryArgs {
    assetTypes?: string[];
    assetState?: "managed" | "unmanaged" | "ghost" | "modified";
    providerIds?: string[];
    responseSize?: number;
    assetNames?: string[];
    arns?: string[];
    modifiedSince?: string;
    freeTextSearch?: string;
    includeConfigration?: boolean;
}

export interface CodifyArgs {
    assetType: string;
    assetId: string;
    iacType: string;
    provider: string;
    accountNumber: string;
}

export interface GetInsightsArgs {
    fields?: string;
    query?: string;
    labels?: string[];
    frameworks?: string[];
    category?: string;
    isDefault?: boolean;
    onlySubscribed?: boolean;
    onlyProduction?: boolean;
    onlyMatchingAssets?: boolean;
    onlyEnabled?: boolean;
    onlyAvailableProviders?: boolean;
    showExclusion?: boolean;
    type?: string[];
    providers?: string[];
    integrations?: string[];
    severity?: number[];
    id?: string[];
    page?: number;
    page_size?: number;
    sorting?: string[];
    providersAccounts?: string[];
}

export interface CreateInsightArgs {
    name: string;
    description?: string;
    code: string;
    type: string[];
    providerIds: string[];
    labels?: string[];
    severity?: number;
    category?: string;
    frameworks?: string[];
}

export interface UpdateInsightArgs {
    id: string;
    name: string;
    description?: string;
    code: string;
    type: string[];
    providerIds: string[];
    labels?: string[];
    severity?: number;
    category?: string;
    frameworks?: string[];
}

export interface DeleteInsightArgs {
    id: string;
}

export class FireflyClient {
    private baseUrl: string = "https://api.firefly.ai/api/v1.0";
    private accessToken: string | null = null;
    private logger: any;
    
    constructor(logger: any, private accessKey?: string, private secretKey?: string) {
        this.logger = logger;
        
        // Use environment variables if not provided as constructor arguments
        this.accessKey = accessKey || process.env.FIREFLY_ACCESS_KEY;
        this.secretKey = secretKey || process.env.FIREFLY_SECRET_KEY;

        if (!this.accessKey || !this.secretKey) {
            throw new Error("Access key and secret key are required for authentication");
        }

        this.accessToken = null;
    }

    private getAuthHeaders() {
        if (!this.accessToken) {
            throw new Error("Not authenticated or token expired. Call login() first.");
        }

        return {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "firefly-mcp-server": "true",
            "firefly-mcp-server-version": "1.0.0",
        };
    }

    async login(accessKey?: string, secretKey?: string): Promise<any> {
        const key = accessKey || this.accessKey;
        const secret = secretKey || this.secretKey;

        if (!key || !secret) {
            throw new Error("Access key and secret key are required for authentication");
        }

        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessKey: key,
                    secretKey: secret,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Authentication failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            this.accessToken = data.accessToken;
            
            this.logger.info("Logged in to Firefly successfully");
            
            return {
                success: true,
                message: "Successfully authenticated",
            };
        } catch (error) {
            this.logger.error("Login error:", error);
            throw error;
        }
    }

    async inventory(args: InventoryArgs): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/inventory`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    includeConfigration: args.includeConfigration || false,
                    size: args.responseSize || 50,
                    // Only include parameters in the request if they are provided
                    ...(args.assetTypes ? { assetTypes: args.assetTypes } : {}),
                    ...(args.assetState ? { state: args.assetState } : {}),
                    ...(args.providerIds ? { providerIds: args.providerIds } : {}),
                    ...(args.assetNames ? { names: args.assetNames } : {}),
                    ...(args.arns ? { arns: args.arns } : {}),
                    ...(args.modifiedSince ? { modifiedSince: args.modifiedSince } : {}),
                    ...(args.freeTextSearch ? { freeTextSearch: args.freeTextSearch } : {}),
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logger.info("Unauthorized. Attempting to re-login...");
                    await this.login();
                    return this.inventory(args);
                }
                const errorText = await response.text();
                throw new Error(`Inventory query failed: ${response.status} ${errorText}`);
            }

            this.logger.info("Inventory query successful");

            return await response.json();
        } catch (error) {
            this.logger.error("Inventory error:", error);
            throw error;
        }
    }

    async codify(args: CodifyArgs): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/codify`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    assetType: args.assetType,
                    assetId: args.assetId,
                    iacType: args.iacType,
                    provider: args.provider,
                    accountNumber: args.accountNumber,
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await this.login();
                    return this.codify(args);
                }
                const errorText = await response.text();
                throw new Error(`Codification failed: ${response.status} ${errorText}`);
            }

            this.logger.info("Codification successful");

            return await response.json();
        } catch (error) {
            this.logger.error("Codify error:", error);
            throw error;
        }
    }

    async getInsights(args: GetInsightsArgs): Promise<any> {
        try {
            const response = await fetch(`https://api.firefly.ai/v2/governance/insights`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    ...(args.fields ? { fields: args.fields } : {}),
                    ...(args.query ? { query: args.query } : {}),
                    ...(args.labels ? { labels: args.labels } : {}),
                    ...(args.frameworks ? { frameworks: args.frameworks } : {}),
                    ...(args.category ? { category: args.category } : {}),
                    ...(args.isDefault !== undefined ? { isDefault: args.isDefault } : {}),
                    ...(args.onlySubscribed !== undefined ? { onlySubscribed: args.onlySubscribed } : {}),
                    ...(args.onlyProduction !== undefined ? { onlyProduction: args.onlyProduction } : {}),
                    ...(args.onlyMatchingAssets !== undefined ? { onlyMatchingAssets: args.onlyMatchingAssets } : {}),
                    ...(args.onlyEnabled !== undefined ? { onlyEnabled: args.onlyEnabled } : {}),
                    ...(args.onlyAvailableProviders !== undefined ? { onlyAvailableProviders: args.onlyAvailableProviders } : {}),
                    ...(args.showExclusion !== undefined ? { showExclusion: args.showExclusion } : {}),
                    ...(args.type ? { type: args.type } : {}),
                    ...(args.providers ? { providers: args.providers } : {}),
                    ...(args.integrations ? { integrations: args.integrations } : {}),
                    ...(args.severity ? { severity: args.severity } : {}),
                    ...(args.id ? { id: args.id } : {}),
                    ...(args.page ? { page: args.page } : {}),
                    ...(args.page_size ? { page_size: args.page_size } : {}),
                    ...(args.sorting ? { sorting: args.sorting } : {}),
                    ...(args.providersAccounts ? { providersAccounts: args.providersAccounts } : {}),
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await this.login();
                    return this.getInsights(args);
                }
                const errorText = await response.text();
                throw new Error(`Get policy failed: ${response.status} ${errorText}`);
            }

            this.logger.info("Get policy successful");

            return await response.json();
        } catch (error) {
            this.logger.error("Get policy error:", error);
            throw error;
        }
    }

    async createInsight(args: CreateInsightArgs): Promise<any> {
        try {
            const response = await fetch(`https://api.firefly.ai/v2/governance/insights/create`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    name: args.name,
                    ...(args.description ? { description: args.description } : {}),
                    code: args.code,
                    type: args.type,
                    providerIds: args.providerIds,
                    ...(args.labels ? { labels: args.labels } : {}),
                    ...(args.severity ? { severity: args.severity } : {}),
                    ...(args.category ? { category: args.category } : {}),
                    ...(args.frameworks ? { frameworks: args.frameworks } : {}),
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await this.login();
                    return this.createInsight(args);
                }
                const errorText = await response.text();
                throw new Error(`Create policy failed: ${response.status} ${errorText}`);
            }

            this.logger.info("Create policy successful");

            return await response.json();
        } catch (error) {
            this.logger.error("Create policy error:", error);
            throw error;
        }
    }

    async updateInsight(args: UpdateInsightArgs): Promise<any> {
        try {
            const response = await fetch(`https://api.firefly.ai/v2/governance/insights/${args.id}`, {
                method: "PUT",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    name: args.name,
                    ...(args.description ? { description: args.description } : {}),
                    code: args.code,
                    type: args.type,
                    providerIds: args.providerIds,
                    ...(args.labels ? { labels: args.labels } : {}),
                    ...(args.severity ? { severity: args.severity } : {}),
                    ...(args.category ? { category: args.category } : {}),
                    ...(args.frameworks ? { frameworks: args.frameworks } : {}),
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await this.login();
                    return this.updateInsight(args);
                }
                const errorText = await response.text();
                throw new Error(`Update policy failed: ${response.status} ${errorText}`);
            }

            this.logger.info("Update policy successful");

            return await response.json();
        } catch (error) {
            this.logger.error("Update policy error:", error);
            throw error;
        }
    }

    async deleteInsight(args: DeleteInsightArgs): Promise<any> {
        try {
            const response = await fetch(`https://api.firefly.ai/v2/governance/insights/${args.id}`, {
                method: "DELETE",
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await this.login();
                    return this.deleteInsight(args);
                }
                const errorText = await response.text();
                throw new Error(`Delete policy failed: ${response.status} ${errorText}`);
            }

            this.logger.info("Delete policy successful");

            return { success: true, message: "policy deleted successfully" };
        } catch (error) {
            this.logger.error("Delete policy error:", error);
            throw error;
        }
    }
}