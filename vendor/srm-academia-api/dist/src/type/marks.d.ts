export interface Mark {
    exam: string;
    obtained: number;
    maxMark: number;
}
export interface MarkDetail {
    course: string;
    category: string;
    marks: Mark[];
    total: {
        obtained: number;
        maxMark: number;
    };
}
export interface MarksResponse {
    markList?: MarkDetail[];
    error?: string;
    status: number;
}
//# sourceMappingURL=marks.d.ts.map