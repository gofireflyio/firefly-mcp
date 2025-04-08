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
}

export interface CodifyArgs {
    assetType: string;
    assetId: string;
    iacType: string;
    provider: string;
    accountNumber: string;
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

        this.login();
    }

    private getAuthHeaders() {
        if (!this.accessToken) {
            throw new Error("Not authenticated or token expired. Call login() first.");
        }

        return {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
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
                    includeConfigration: false,
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
}