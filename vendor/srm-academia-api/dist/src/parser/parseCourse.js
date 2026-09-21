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
exports.parseCourseDetails = parseCourseDetails;
const cheerio = __importStar(require("cheerio"));
async function parseCourseDetails(response) {
    try {
        const match = response.match(/pageSanitizer\.sanitize\('(.*)'\);/s);
        if (!match || !match[1]) {
            return { error: "Failed to extract course details", status: 404 };
        }
        const encodedHtml = match[1];
        const decodedHtml = encodedHtml
            .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\\\/g, "")
            .replace(/\\'/g, "'");
        const $ = cheerio.load(decodedHtml);
        let batch = "";
        try {
            batch = $("td:contains('Batch:')").next("td").find("font").text().trim();
        }
        catch {
            batch = "";
        }
        const courseList = Array.from($(".course_tbl tr").slice(1)).map((row) => {
            const columns = $(row).find("td");
            const get = (idx) => columns[idx] ? $(columns[idx]).text().trim() : "";
            const getFormat = (idx) => get(idx).length === 0 ? "NA" : get(idx);
            const slotRaw = get(8);
            const sortedSlot = slotRaw
                ? slotRaw
                    .split("-")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
            return {
                courseCode: getFormat(1),
                courseTitle: getFormat(2),
                courseCredit: getFormat(3),
                courseCategory: getFormat(5),
                courseType: getFormat(6),
                courseFaculty: getFormat(7),
                courseSlot: sortedSlot,
                courseRoomNo: getFormat(10).startsWith("AY")
                    ? getFormat(9)
                    : getFormat(10),
            };
        });
        return { courseList, batch, status: 200 };
    }
    catch (error) {
        console.error("Error parsing course details:", error);
        return { error: "Failed to parse course details", status: 500 };
    }
}
//# sourceMappingURL=parseCourse.js.map