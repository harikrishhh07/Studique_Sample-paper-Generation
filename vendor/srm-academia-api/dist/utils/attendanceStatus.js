"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceStatus = attendanceStatus;
async function attendanceStatus({ conducted, absent, }) {
    const target = 0.75;
    if (conducted === 0) {
        return { status: "margin", classes: 0 };
    }
    const present = conducted - absent;
    const currentRatio = present / conducted;
    if (currentRatio < target) {
        const x = Math.ceil((target * conducted - present) / (1 - target));
        return {
            status: "required",
            classes: x,
        };
    }
    else {
        const x = Math.floor(present / target - conducted);
        return {
            status: "margin",
            classes: x,
        };
    }
}
//# sourceMappingURL=attendanceStatus.js.map