"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUserInfo = fetchUserInfo;
const axios_1 = __importDefault(require("axios"));
async function fetchUserInfo(cookie) {
    try {
        const request = await (0, axios_1.default)("https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24", {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                cookie,
                Referer: "https://academia.srmist.edu.in/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            method: "GET",
        });
        return request.data;
    }
    catch (error) {
        if (error &&
            typeof error === "object" &&
            "status" in error &&
            error.status === 500) {
            return { error: "Unauthorized", status: 401 };
        }
        // Handle other errors
        return {
            error: error instanceof Error ? error.message : "Failed to fetch user info",
            status: error && typeof error === "object" && "status" in error
                ? error.status
                : 500,
        };
    }
}
//# sourceMappingURL=fetchUserInfo.js.map