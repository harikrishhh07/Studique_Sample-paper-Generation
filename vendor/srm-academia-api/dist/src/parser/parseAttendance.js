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
exports.parseAttendance = parseAttendance;
const cheerio = __importStar(require("cheerio"));
const attendanceStatus_1 = require("../../utils/attendanceStatus");
async function parseAttendance(response) {
    try {
        const match = response.match(/pageSanitizer\.sanitize\('(.*)'\);/s);
        if (!match || !match[1]) {
            return { error: "Failed to extract attendance data", status: 404 };
        }
        const encodedHtml = match[1];
        const decodedHtml = encodedHtml
            .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\\\/g, "")
            .replace(/\\'/g, "'");
        const $ = cheerio.load(decodedHtml);
        const table = $('table[style*="font-size :16px;"][bgcolor="#FAFAD2"]');
        const rows = table.find("tr").slice(1).toArray();
        const attendanceDetails = await Promise.all(rows.map(async (row) => {
            const cols = $(row).find("td");
            const get = (idx) => cols[idx] ? $(cols[idx]).text().trim() : "";
            const data = {
                courseCode: cols[0]
                    ? $(cols[0]).contents().first().text().trim()
                    : "",
                courseTitle: get(1),
                courseCategory: get(2),
                courseFaculty: get(3).split("(")[0].trim(),
                courseSlot: get(4),
                courseConducted: get(6) ? Number(get(6)) : 0,
                courseAbsent: get(7) ? Number(get(7)) : 0,
                courseAttendanceStatus: await (0, attendanceStatus_1.attendanceStatus)({
                    conducted: Number(get(6)),
                    absent: Number(get(7)),
                }),
            };
            const courseAttendance = Number(((data.courseConducted - data.courseAbsent) / data.courseConducted) *
                100).toFixed(2);
            return {
                ...data,
                courseAttendance,
            };
        }));
        return { attendance: attendanceDetails, status: 200 };
    }
    catch (error) {
        console.error("Error parsing attendance:", error);
        return { error: "Failed to parse attendance", status: 500 };
    }
}
//# sourceMappingURL=parseAttendance.js.map