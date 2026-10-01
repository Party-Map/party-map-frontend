import { splitByNow } from "./eventTime";

const span = (id: string, start: string, end: string) => ({ id, start, end });

describe("splitByNow", () => {
    it("keeps running and coming events upcoming (soonest first), the rest past (latest first)", () => {
        const now = new Date("2030-06-01T12:00:00");
        const { upcoming, past } = splitByNow(
            [
                span("later", "2030-07-01T20:00:00", "2030-07-02T02:00:00"),
                span("running", "2030-06-01T10:00:00", "2030-06-01T14:00:00"),
                span("old", "2030-01-01T20:00:00", "2030-01-02T02:00:00"),
                span("older", "2029-01-01T20:00:00", "2029-01-02T02:00:00"),
            ],
            now,
        );
        expect(upcoming.map((e) => e.id)).toEqual(["running", "later"]);
        expect(past.map((e) => e.id)).toEqual(["old", "older"]);
    });

    it("handles an empty list", () => {
        expect(splitByNow([], new Date())).toEqual({ upcoming: [], past: [] });
    });
});
