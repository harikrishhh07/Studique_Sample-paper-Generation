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
exports.parseUserInfo = parseUserInfo;
const cheerio = __importStar(require("cheerio"));
async function parseUserInfo(response) {
    try {
        const match = response.match(/pageSanitizer\.sanitize\('(.*)'\);/s);
        if (!match || !match[1]) {
            return { error: "Failed to extract user details", status: 404 };
        }
        const encodedHtml = match[1];
        const decodedHtml = encodedHtml
            .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\\\/g, "")
            .replace(/\\'/g, "'");
        const $ = cheerio.load(decodedHtml);
        const getText = (selector) => $(selector).text().trim();
        const userInfo = {
            regNumber: getText('td:contains("Registration Number:") + td strong'),
            name: getText('td:contains("Name:") + td strong'),
            mobile: getText('td:contains("Mobile:") + td strong'),
            section: getText('td:contains("Department:") + td strong')
                .split("-")[1]
                .replace("(", "")
                .replace(")", "")
                .replace("Section", "")
                .trim(),
            program: getText('td:contains("Program:") + td strong'),
            department: getText('td:contains("Department:") + td strong')
                .split("-")[0]
                .trim(),
            semester: getText('td:contains("Semester:") + td strong'),
            batch: getText('td:contains("Batch:") + td strong font'),
        };
        return { userInfo, status: 200 };
    }
    catch (error) {
        console.error("Error parsing user info:", error);
        return { error: "Failed to parse user info", status: 500 };
    }
}
//# sourceMappingURL=parseUserInfo.js.map