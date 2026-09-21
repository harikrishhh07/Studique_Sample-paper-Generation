"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = verifyUser;
exports.verifyPassword = verifyPassword;
exports.logoutUser = logoutUser;
exports.getTimetable = getTimetable;
exports.getAttendance = getAttendance;
exports.getMarks = getMarks;
exports.getUserInfo = getUserInfo;
exports.getCalendar = getCalendar;
exports.getCourse = getCourse;
const validatePassword_1 = require("./auth/validatePassword");
const validateUser_1 = require("./auth/validateUser");
const fetchAttendance_1 = require("./fetch/fetchAttendance");
const fetchCourseDetails_1 = require("./fetch/fetchCourseDetails");
const fetchMarks_1 = require("./fetch/fetchMarks");
const fetchUserInfo_1 = require("./fetch/fetchUserInfo");
const fetchLogout_1 = require("./fetch/fetchLogout");
const parseAttendance_1 = require("./parser/parseAttendance");
const parseCalender_1 = require("./parser/parseCalender");
const parseCourse_1 = require("./parser/parseCourse");
const parseMarks_1 = require("./parser/parseMarks");
const parseTimetable_1 = require("./parser/parseTimetable");
const parseUserInfo_1 = require("./parser/parseUserInfo");
const fetchTimetable_1 = require("./fetch/fetchTimetable");
const fetchCalender_1 = require("./fetch/fetchCalender");
// Verify-user
async function verifyUser(username) {
    return await (0, validateUser_1.validateUser)(username);
}
// Verify-password
async function verifyPassword({ identifier, digest, password, }) {
    return await (0, validatePassword_1.validatePassword)({ identifier, digest, password });
}
// Logout
async function logoutUser(cookie) {
    return await (0, fetchLogout_1.fetchLogout)(cookie);
}
// Get TimeTable
async function getTimetable(cookie) {
    const fetch = await (0, fetchTimetable_1.fetchTimetable)(cookie);
    if (fetch.error)
        return { error: fetch.error, status: fetch.status };
    const parse = await (0, parseTimetable_1.parseTimetable)(fetch);
    if (parse.error)
        return { error: parse.error, status: parse.status };
    return parse;
}
// Get Attendance
async function getAttendance(cookie) {
    const fetch = await (0, fetchAttendance_1.fetchAttendance)(cookie);
    if (fetch.error)
        return { error: fetch.error, status: fetch.status };
    const parse = await (0, parseAttendance_1.parseAttendance)(fetch);
    if (parse.error)
        return { error: parse.error, status: parse.status };
    return parse;
}
// Get Marks
async function getMarks(cookie) {
    const fetch = await (0, fetchMarks_1.fetchMarks)(cookie);
    if (fetch.error)
        return { error: fetch.error, status: fetch.status };
    const parse = await (0, parseMarks_1.parseMarks)(fetch);
    if (parse.error)
        return { error: parse.error, status: parse.status };
    return parse;
}
// Get UserInfo
async function getUserInfo(cookie) {
    const fetch = await (0, fetchUserInfo_1.fetchUserInfo)(cookie);
    if (fetch.error)
        return { error: fetch.error, status: fetch.status };
    const parse = await (0, parseUserInfo_1.parseUserInfo)(fetch);
    if (parse.error)
        return { error: parse.error, status: parse.status };
    return parse;
}
// Get Calendar
async function getCalendar(cookie) {
    const fetch = await (0, fetchCalender_1.fetchCalendar)(cookie);
    if (fetch.error)
        return { error: fetch.error, status: fetch.status };
    const parse = await (0, parseCalender_1.parseCalendar)(fetch);
    if (parse.error)
        return { error: parse.error, status: parse.status };
    return parse;
}
// Get Course
async function getCourse(cookie) {
    const fetch = await (0, fetchCourseDetails_1.fetchCourseDetails)(cookie);
    if (fetch.error)
        return { error: fetch.error, status: fetch.status };
    const parse = await (0, parseCourse_1.parseCourseDetails)(fetch);
    if (parse.error)
        return { error: parse.error, status: parse.status };
    return parse;
}
//# sourceMappingURL=index.js.map