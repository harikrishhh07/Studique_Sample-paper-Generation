import { PasswordInput, UserResponse, AuthResult, UserValidationResult, LogoutResponse, TimetableResponse, AttendanceResponse, MarksResponse, CalendarResponse, CourseResponse, UserInfoResponse, MarkDetail, Mark, Month, Day, CourseDetail, AttendanceDetail, UserInfo, DaySchedule, CourseSlot, SlotInfo } from "./type";
export type { PasswordInput, UserResponse, AuthResult, UserValidationResult, LogoutResponse, TimetableResponse, AttendanceResponse, MarksResponse, CalendarResponse, CourseResponse, UserInfoResponse, MarkDetail, Mark, Month, Day, CourseDetail, AttendanceDetail, UserInfo, DaySchedule, CourseSlot, SlotInfo, };
export declare function verifyUser(username: string): Promise<UserValidationResult>;
export declare function verifyPassword({ identifier, digest, password, }: PasswordInput): Promise<AuthResult>;
export declare function logoutUser(cookie: string): Promise<LogoutResponse>;
export declare function getTimetable(cookie: string): Promise<TimetableResponse>;
export declare function getAttendance(cookie: string): Promise<AttendanceResponse>;
export declare function getMarks(cookie: string): Promise<MarksResponse>;
export declare function getUserInfo(cookie: string): Promise<UserInfoResponse>;
export declare function getCalendar(cookie: string): Promise<CalendarResponse>;
export declare function getCourse(cookie: string): Promise<CourseResponse>;
//# sourceMappingURL=index.d.ts.map