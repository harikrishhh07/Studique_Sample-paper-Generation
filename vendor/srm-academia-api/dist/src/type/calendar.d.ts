export interface Day {
    date: string;
    day: string;
    event: string;
    dayOrder: string;
}
export interface Month {
    month: string;
    days: Day[];
}
export interface CalendarResponse {
    calendar?: Month[];
    error?: string;
    status: number;
}
//# sourceMappingURL=calendar.d.ts.map