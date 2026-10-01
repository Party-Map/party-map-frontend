import { eventPlan } from "@/test/fixtures";

import { eventPlanSchema, eventPlanSummary, toEventPlanFormValues, toEventPlanPayload } from "./eventPlanFormSchema";

const valid = {
    ...toEventPlanFormValues(),
    title: "Summer Opening",
    startDateTime: "2030-07-01T18:00",
    endDateTime: "2030-07-02T02:00",
    price: "2500",
};

describe("event plan form", () => {
    it("starts as an empty pub night and prefills from a plan", () => {
        expect(toEventPlanFormValues()).toMatchObject({ title: "", kind: "PUB", startDateTime: "", price: "" });
        expect(toEventPlanFormValues(eventPlan)).toMatchObject({
            title: eventPlan.title,
            startDateTime: "2030-07-01T18:00",
            endDateTime: "2030-07-02T02:00",
        });
        expect(toEventPlanFormValues({ ...eventPlan, price: null, image: null })).toMatchObject({
            price: "",
            image: "",
        });
    });

    it("requires the title, both times and a price", () => {
        const issues = eventPlanSchema.safeParse(toEventPlanFormValues()).error!.issues;
        expect(issues.map((issue) => issue.path[0])).toEqual(["title", "startDateTime", "endDateTime", "price"]);
    });

    it("takes the price as whole forints", () => {
        expect(eventPlanSchema.safeParse({ ...valid, price: "0" }).success).toBe(true);
        expect(eventPlanSchema.safeParse({ ...valid, price: "12.5" }).error?.issues[0]?.message).toBe(
            "Enter the price in forints, digits only (0 for free).",
        );
        expect(eventPlanSchema.safeParse({ ...valid, price: "-5" }).success).toBe(false);
    });

    it("needs the end after the start", () => {
        const result = eventPlanSchema.safeParse({ ...valid, endDateTime: "2030-07-01T17:00" });
        expect(result.error?.issues[0]).toMatchObject({
            path: ["endDateTime"],
            message: "The end must be after the start.",
        });
    });

    it("builds the payload", () => {
        expect(toEventPlanPayload(eventPlanSchema.parse(valid))).toEqual({
            title: "Summer Opening",
            kind: "PUB",
            description: "",
            startDateTime: "2030-07-01T18:00",
            endDateTime: "2030-07-02T02:00",
            price: "2500",
            image: null,
        });
        const links = [{ type: "WEBSITE" as const, url: "https://a38.hu" }];
        expect(toEventPlanPayload(eventPlanSchema.parse({ ...valid, links })).links).toEqual(links);
    });

    it("summarises the time and the price for the review", () => {
        const rows = (values: typeof valid) =>
            Object.fromEntries(eventPlanSummary(values).map((row) => [row.label, row.value]));
        expect(rows(valid)).toMatchObject({ Kind: "Pub", Price: "2500 HUF" });
        expect(rows(valid).When).not.toBe("—");
        expect(rows({ ...valid, price: "0" }).Price).toBe("Free");
        expect(rows({ ...valid, price: "", startDateTime: "" })).toMatchObject({ Price: "—", When: "—" });
        expect(rows({ ...valid, endDateTime: "nonsense" }).When).toBe("—");
    });
});
