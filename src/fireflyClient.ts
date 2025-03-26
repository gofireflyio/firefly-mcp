interface LoginArgs {
    accessKey?: string;
    secretKey?: string;
}

export interface InventoryArgs {
    pageNumber?: number;
    assetType?: string;
    assetState?: "managed" | "unmanaged" | "ghost" | "modified";
    modifiedSince?: string;
}

export interface CodifyArgs {
    assetType: string;
    assetId: string;
    iacType: string;
    provider: string;
    accountNumber: string;
    codificationMode?: string;
}

export class FireflyClient {
    private baseUrl: string = "https://api.firefly.ai/api/v1.0";
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(private accessKey?: string, private secretKey?: string) {
        // Use environment variables if not provided as constructor arguments
        this.accessKey = accessKey || process.env.FIREFLY_ACCESS_KEY;
        this.secretKey = secretKey || process.env.FIREFLY_SECRET_KEY;

        if (!this.accessKey || !this.secretKey) {
            throw new Error("Access key and secret key are required for authentication");
        }

        this.login();
    }

    private getAuthHeaders() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
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
            this.tokenExpiry = data.expiresAt * 1000; // Convert to milliseconds

            return {
                success: true,
                message: "Successfully authenticated",
                expiresAt: new Date(this.tokenExpiry).toISOString(),
            };
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    async inventory(args: InventoryArgs): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/inventory`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    pageNumber: args.pageNumber || 1,
                    assetType: args.assetType,
                    assetState: args.assetState,
                    modifiedSince: args.modifiedSince,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Inventory query failed: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Inventory error:", error);
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
                    codificationMode: args.codificationMode,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Codification failed: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Codify error:", error);
            throw error;
        }
    }
}