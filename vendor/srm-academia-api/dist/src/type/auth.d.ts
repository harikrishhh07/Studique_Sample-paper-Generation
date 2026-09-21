export interface PasswordInput {
    identifier: string;
    digest: string;
    password: string;
}
export interface UserRequest {
    lookup?: {
        identifier: string;
        digest: string;
    };
    status_code: number;
    message: string;
}
export interface UserResponse {
    identifier?: string;
    digest?: string;
    status_code: number;
    message: string;
}
export interface PasswordResponse {
    status_code: number;
    localized_message?: string;
    cdigest?: string;
}
export interface AuthResult {
    data?: {
        cookies?: string;
        statusCode: number;
        message?: string;
        captcha?: {
            required: boolean;
            digest: string | null | undefined;
        };
    };
    isAuthenticated?: boolean;
    error?: string;
    errorReason?: unknown;
}
export interface UserValidationResult {
    data?: UserResponse;
    error?: string;
    errorReason?: unknown;
}
export interface LogoutResponse {
    message: string;
    status: number;
}
//# sourceMappingURL=auth.d.ts.map