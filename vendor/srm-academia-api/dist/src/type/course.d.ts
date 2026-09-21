export interface CourseDetail {
    courseCode: string;
    courseTitle: string;
    courseCredit: string;
    courseCategory: string;
    courseType: string;
    courseFaculty: string;
    courseSlot: string[];
    courseRoomNo: string;
}
export interface CourseResponse {
    courseList?: CourseDetail[];
    batch?: string;
    error?: string;
    status: number;
}
//# sourceMappingURL=course.d.ts.map