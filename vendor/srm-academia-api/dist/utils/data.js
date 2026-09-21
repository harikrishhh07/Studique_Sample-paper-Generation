"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchSlots = void 0;
const time = [
    "08:00 AM - 08:50 AM",
    "08:50 AM - 09:40 AM",
    "09:45 AM - 10:35 AM",
    "10:40 AM - 11:30 AM",
    "11:35 AM - 12:25 PM",
    "12:30 PM - 01:20 PM",
    "01:25 PM - 02:15 PM",
    "02:20 PM - 03:10 PM",
    "03:10 PM - 04:00 PM",
    "04:00 PM - 04:50 PM",
];
const batchSlots = {
    1: {
        slots: [
            {
                dayOrder: "Day 1",
                slots: ["A", "A", "F", "F", "G", "P6", "P7", "P8", "P9", "P10"],
                time,
            },
            {
                dayOrder: "Day 2",
                slots: ["P11", "P12", "P13", "P14", "P15", "B", "B", "G", "G", "A"],
                time,
            },
            {
                dayOrder: "Day 3",
                slots: ["C", "C", "A", "D", "B", "P26", "P27", "P28", "P29", "P30"],
                time,
            },
            {
                dayOrder: "Day 4",
                slots: ["P31", "P32", "P33", "P34", "P35", "D", "D", "B", "E", "C"],
                time,
            },
            {
                dayOrder: "Day 5",
                slots: ["E", "E", "C", "F", "D", "P46", "P47", "P48", "P49", "P50"],
                time,
            },
        ],
    },
    2: {
        slots: [
            {
                dayOrder: "Day 1",
                slots: ["P1", "P2", "P3", "P4", "P5", "A", "A", "F", "F", "G"],
                time,
            },
            {
                dayOrder: "Day 2",
                slots: ["B", "B", "G", "G", "A", "P16", "P17", "P18", "P19", "P20"],
                time,
            },
            {
                dayOrder: "Day 3",
                slots: ["P21", "P22", "P23", "P24", "P25", "C", "C", "A", "D", "B"],
                time,
            },
            {
                dayOrder: "Day 4",
                slots: ["D", "D", "B", "E", "C", "P36", "P37", "P38", "P39", "P40"],
                time,
            },
            {
                dayOrder: "Day 5",
                slots: ["P41", "P42", "P43", "P44", "P45", "E", "E", "C", "F", "D"],
                time,
            },
        ],
    },
};
exports.batchSlots = batchSlots;
//# sourceMappingURL=data.js.map