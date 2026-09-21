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
exports.parseCalendar = parseCalendar;
const cheerio = __importStar(require("cheerio"));
async function parseCalendar(response) {
    try {
        const $outer = cheerio.load(response);
        const zmlValue = $outer("div.zc-pb-embed-placeholder-content").attr("zmlvalue");
        if (!zmlValue) {
            return { error: "Failed to extract calendar details", status: 404 };
        }
        const $inner = cheerio.load(zmlValue);
        const $mainTable = $inner("table[bgcolor='#FAFCFE']");
        if ($mainTable.length === 0) {
            return { error: "Could not find the main calendar table.", status: 500 };
        }
        const $headerRow = $mainTable.find("tr").first();
        const $ths = $headerRow.find("th");
        const monthsData = [];
        for (let i = 0;; i++) {
            const monthNameThIndex = i * 5 + 2;
            if (monthNameThIndex >= $ths.length)
                break;
            const monthName = $ths.eq(monthNameThIndex).find("strong").text().trim();
            if (monthName) {
                monthsData.push({ month: monthName, days: [] });
            }
            else {
                break;
            }
        }
        const $dataRows = $mainTable.find("tr").slice(1).toArray();
        $dataRows.forEach((rowElement) => {
            const $tds = $inner(rowElement).find("td");
            monthsData.forEach((month, monthIndex) => {
                const offset = monthIndex * 5;
                if (offset + 3 >= $tds.length)
                    return;
                const date = $tds.eq(offset).text().trim();
                if (!date)
                    return;
                const day = $tds
                    .eq(offset + 1)
                    .text()
                    .trim();
                const event = $tds
                    .eq(offset + 2)
                    .find("strong")
                    .text()
                    .trim();
                const dayOrder = $tds
                    .eq(offset + 3)
                    .text()
                    .trim();
                month.days.push({ date, day, event, dayOrder });
            });
        });
        return { calendar: monthsData, status: 200 };
    }
    catch (error) {
        console.error("Error parsing calendar:", error);
        return { error: "Failed to parse calendar", status: 500 };
    }
}
//# sourceMappingURL=parseCalender.js.map