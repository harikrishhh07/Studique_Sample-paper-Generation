"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTimetable = parseTimetable;
const cheerio = __importStar(require("cheerio"));
const data_1 = require("../../utils/data");
async function parseTimetable(response) {
    try {
        const match = response.match(/pageSanitizer\.sanitize\('(.*)'\);/s);
        if (!match || !match[1]) {
            return { error: "Failed to extract timetable details", status: 404 };
        }
        const encodedHtml = match[1];
        const decodedHtml = encodedHtml
            .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\\\/g, "")
            .replace(/\\'/g, "'");
        const $ = cheerio.load(decodedHtml);
        const batch = $("td:contains('Batch:')")
            .next("td")
            .find("font")
            .text()
            .trim();
        const courseList = Array.from($(".course_tbl tr").slice(1)).map((row) => {
            const columns = $(row).find("td");
            const get = (idx) => columns[idx] ? $(columns[idx]).text().trim() : "";
            const slotRaw = get(8);
            const sortedSlot = slotRaw
                ? slotRaw
                    .split("-")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
            return {
                courseCode: get(1),
                courseTitle: get(2),
                courseCredit: get(3),
                courseCategory: get(5),
                courseType: get(6),
                courseFaculty: get(7),
                courseSlot: sortedSlot,
                courseRoomNo: get(10).startsWith("AY")
                    ? get(9).length === 0
                        ? "N/A"
                        : get(9)
                    : get(10),
            };
        });
        const batchData = data_1.batchSlots[parseInt(batch)];
        const slotMap = {};
        courseList.forEach((course) => {
            course.courseSlot.forEach((slot) => {
                if (slot) {
                    slotMap[slot] = {
                        courseTitle: course.courseTitle,
                        courseCode: course.courseCode,
                        courseType: course.courseType,
                        courseCategory: course.courseCategory,
                        courseRoomNo: course.courseRoomNo,
                    };
                }
            });
        });
        const timetable = batchData.slots.map((day) => ({
            dayOrder: day.dayOrder,
            class: day.slots.map((slot, i) => {
                const slotInfo = slotMap[slot]
                    ? {
                        slot,
                        isClass: true,
                        courseTitle: slotMap[slot].courseTitle,
                        courseCode: slotMap[slot].courseCode,
                        courseType: slotMap[slot].courseType,
                        courseCategory: slotMap[slot].courseCategory,
                        courseRoomNo: slotMap[slot].courseRoomNo,
                    }
                    : { slot, isClass: false };
                return {
                    ...slotInfo,
                    time: day.time[i],
                };
            }),
        }));
        return { timetable, status: 200 };
    }
    catch (error) {
        console.error("Error parsing timetable:", error);
        return { error: "Failed to parse timetable", status: 500 };
    }
}
//# sourceMappingURL=parseTimetable.js.map