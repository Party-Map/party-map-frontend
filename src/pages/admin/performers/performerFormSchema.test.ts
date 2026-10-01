import { performer } from "@/test/fixtures";

import { performerSchema, performerSummary, toPerformerFormValues, toPerformerPayload } from "./performerFormSchema";

describe("performer form", () => {
    it("starts empty and prefills from a performer", () => {
        expect(toPerformerFormValues()).toEqual({ name: "", genre: "", bio: "", image: "", links: [] });
        expect(toPerformerFormValues({ ...performer, image: null })).toMatchObject({
            name: performer.name,
            genre: performer.genre,
            image: "",
        });
    });

    it("requires a name and a genre", () => {
        const issues = performerSchema.safeParse(toPerformerFormValues()).error!.issues;
        expect(issues.map((issue) => issue.message)).toEqual(["Name is required.", "Genre is required."]);
    });

    it("builds the payload", () => {
        const parsed = performerSchema.parse({ ...toPerformerFormValues(performer), image: "", links: [] });
        expect(toPerformerPayload(parsed)).toEqual({
            name: performer.name,
            genre: performer.genre,
            bio: performer.bio,
            image: null,
        });
        expect(toPerformerPayload(performerSchema.parse(toPerformerFormValues(performer))).links).toEqual(
            performer.links,
        );
    });

    it("summarises every value for the review", () => {
        expect(performerSummary(toPerformerFormValues(performer)).map((row) => row.label)).toEqual([
            "Name",
            "Genre",
            "Bio",
            "Image",
            "Links",
        ]);
    });
});
