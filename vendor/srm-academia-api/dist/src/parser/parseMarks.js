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
exports.parseMarks = parseMarks;
const cheerio = __importStar(require("cheerio"));
async function parseMarks(response) {
    try {
        const match = response.match(/pageSanitizer\.sanitize\('(.*)'\);/s);
        if (!match || !match[1]) {
            console.error("Failed to extract sanitized content from response");
            return { error: "Failed to extract marks data", status: 404 };
        }
        const encodedHtml = match[1];
        const decodedHtml = encodedHtml
            .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\\\/g, "")
            .replace(/\\'/g, "'");
        const $ = cheerio.load(decodedHtml);
        const table = $("table:nth-child(7)");
        const marksDetails = [];
        const tableRows = table.find("tr");
        tableRows.each((i, row) => {
            if (i === 0)
                return;
            const cols = $(row).find("td");
            const course = $(cols[0]).text().trim();
            const category = $(cols[1]).text().trim();
            const marksTable = $(cols[2]).find("table");
            if (course === "" || category === "" || marksTable.length === 0)
                return;
            const marks = [];
            const total = { obtained: 0, maxMark: 0 };
            marksTable.find("td").each((j, markTd) => {
                const strongText = $(markTd).find("strong").text().trim();
                const [type, max] = strongText.split("/");
                const obtained = $(markTd)
                    .text()
                    .replace(strongText, "")
                    .trim()
                    .replace(/^\n+|\n+$/g, "");
                if (type && max) {
                    marks.push({
                        exam: type.trim(),
                        obtained: Number(obtained),
                        maxMark: Number(max.trim()),
                    });
                }
                const obtainedMarks = parseFloat(obtained);
                if (!isNaN(obtainedMarks)) {
                    total.obtained += obtainedMarks;
                }
                const maxMarks = parseFloat(max);
                if (!isNaN(maxMarks)) {
                    total.maxMark += maxMarks;
                }
            });
            total.obtained = Number(total.obtained.toFixed(2));
            total.maxMark = Number(total.maxMark.toFixed(2));
            marksDetails.push({ course, category, marks, total });
        });
        return { markList: marksDetails, status: 200 };
    }
    catch (error) {
        console.error("Error parsing marks:", error);
        return { error: "Failed to parse marks", status: 500 };
    }
}
//# sourceMappingURL=parseMarks.js.map