import {
    calendarDayLabel,
    clampDateTimeRange,
    endsAfterStart,
    formatDateTime,
    formatDateTimeRange,
    formatNextEventStart,
    formatTime,
    isSameDay,
    isValidDate,
    toDateTimeLocalInput,
} from "./format";

const now = new Date(2030, 5, 15, 12, 0); // Saturday 15 June 2030, 12:00 local

describe("formatTime", () => {
    it("formats 24-hour time", () => {
        expect(formatTime("2030-06-15T09:05:00")).toBe("09:05");
        expect(formatTime(new Date(2030, 5, 15, 23, 59))).toBe("23:59");
    });
});

describe("calendarDayLabel", () => {
    it("names nearby days", () => {
        expect(calendarDayLabel("2030-06-15T20:00:00", now)).toBe("Today");
        expect(calendarDayLabel("2030-06-16T01:00:00", now)).toBe("Tomorrow");
        expect(calendarDayLabel("2030-06-14T23:00:00", now)).toBe("Yesterday");
    });

    it("uses weekday names within a week", () => {
        expect(calendarDayLabel("2030-06-18T20:00:00", now)).toBe("Tuesday");
        expect(calendarDayLabel("2030-06-12T20:00:00", now)).toBe("Last Wednesday");
    });

    it("falls back to a numeric date", () => {
        expect(calendarDayLabel("2030-12-24T20:00:00", now)).toBe("24/12/2030");
        expect(calendarDayLabel("2030-06-01T20:00:00", now)).toBe("01/06/2030");
    });
});

describe("formatDateTimeRange", () => {
    it("collapses same-day ranges", () => {
        expect(formatDateTimeRange("2030-06-15T14:00:00", "2030-06-15T16:00:00", now)).toBe("Today • 14:00 – 16:00");
    });

    it("spells out multi-day ranges", () => {
        expect(formatDateTimeRange("2030-06-15T22:00:00", "2030-06-16T04:00:00", now)).toBe(
            "Today 22:00 – Tomorrow 04:00",
        );
    });
});

describe("formatNextEventStart", () => {
    it("returns null for missing or invalid values", () => {
        expect(formatNextEventStart(null, now)).toBeNull();
        expect(formatNextEventStart(undefined, now)).toBeNull();
        expect(formatNextEventStart("not a date", now)).toBeNull();
    });

    it("shows the time when today and the date otherwise", () => {
        expect(formatNextEventStart("2030-06-15T21:30:00", now)).toBe("21:30");
        expect(formatNextEventStart("2030-08-03T21:30:00", now)).toBe("3 Aug");
        expect(formatNextEventStart("2031-01-03T21:30:00", now)).toBe("3 Jan 2031");
    });
});

describe("formatDateTime and toDateTimeLocalInput", () => {
    it("formats admin labels and input values", () => {
        expect(formatDateTime("2030-06-05T08:07:00")).toBe("2030-06-05 08:07");
        expect(toDateTimeLocalInput("2030-06-05T08:07:00")).toBe("2030-06-05T08:07");
        expect(toDateTimeLocalInput(null)).toBe("");
        expect(toDateTimeLocalInput("garbage")).toBe("");
    });
});

describe("clampDateTimeRange", () => {
    const min = "2030-06-01T18:00:00";
    const max = "2030-06-02T02:00:00";

    it("keeps ranges inside the bounds unchanged", () => {
        expect(clampDateTimeRange("2030-06-01T20:00", "2030-06-01T22:00", min, max)).toEqual({
            startTime: "2030-06-01T20:00",
            endTime: "2030-06-01T22:00",
        });
    });

    it("clamps to the bounds and orders start before end", () => {
        expect(clampDateTimeRange("2030-06-01T10:00", "2030-06-03T10:00", min, max)).toEqual({
            startTime: "2030-06-01T18:00",
            endTime: "2030-06-02T02:00",
        });
        expect(clampDateTimeRange("2030-06-01T23:00", "2030-06-01T20:00", min, max)).toEqual({
            startTime: "2030-06-01T23:00",
            endTime: "2030-06-01T23:00",
        });
    });

    it("replaces invalid inputs with the bounds", () => {
        expect(clampDateTimeRange("", "", min, max)).toEqual({
            startTime: "2030-06-01T18:00",
            endTime: "2030-06-02T02:00",
        });
    });
});

describe("helpers", () => {
    it("detects same day and validity", () => {
        expect(isSameDay(new Date(2030, 0, 1, 1), new Date(2030, 0, 1, 23))).toBe(true);
        expect(isSameDay(new Date(2030, 0, 1), new Date(2030, 0, 2))).toBe(false);
        expect(isValidDate(new Date("nope"))).toBe(false);
    });

    it("knows whether a range ends after it starts", () => {
        expect(endsAfterStart("2030-07-01T18:00", "2030-07-01T22:00")).toBe(true);
        expect(endsAfterStart("2030-07-01T22:00", "2030-07-01T22:00")).toBe(false);
        expect(endsAfterStart("2030-07-01T22:00", "2030-07-01T18:00")).toBe(false);
        expect(endsAfterStart("", "2030-07-01T18:00")).toBe(false);
    });
});
