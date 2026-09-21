export interface UserInfo {
    regNumber: string;
    name: string;
    mobile: string;
    section: string;
    program: string;
    department: string;
    semester: string;
    batch: string;
}
export interface UserInfoResponse {
    userInfo?: UserInfo;
    error?: string;
    status: number;
}
//# sourceMappingURL=user.d.ts.map