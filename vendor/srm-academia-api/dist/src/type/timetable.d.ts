export interface SlotInfo {
    courseTitle: string;
    courseCode: string;
    courseType: string;
    courseCategory: string;
    courseRoomNo: string;
}
export interface CourseSlot {
    slot: string;
    isClass: boolean;
    courseTitle?: string;
    courseCode?: string;
    courseType?: string;
    courseCategory?: string;
    courseRoomNo?: string;
    time: string;
}
export interface DaySchedule {
    dayOrder: string;
    class: CourseSlot[];
}
export interface TimetableResponse {
    timetable?: DaySchedule[];
    error?: string;
    status: number;
}
//# sourceMappingURL=timetable.d.ts.map