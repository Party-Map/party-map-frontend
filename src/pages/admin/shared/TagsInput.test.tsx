import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { TagsInput, withTags } from "./TagsInput";

function Harness({ initial = [], onChange = vi.fn() }: { initial?: string[]; onChange?: (tags: string[]) => void }) {
    const [tags, setTags] = useState(initial);
    return (
        <>
            <label htmlFor="tags">Tags</label>
            <TagsInput
                id="tags"
                value={tags}
                onChange={(next) => {
                    setTags(next);
                    onChange(next);
                }}
                placeholder="bar…"
            />
        </>
    );
}

describe("withTags", () => {
    it("adds trimmed tags, skipping blanks and duplicates in any case", () => {
        expect(withTags(["Bar"], [" terrace ", "", "bar", "TERRACE", "techno"])).toEqual(["Bar", "terrace", "techno"]);
    });

    it("cuts long tags and stops at 20", () => {
        expect(withTags([], ["x".repeat(50)])).toEqual(["x".repeat(40)]);
        const twenty = Array.from({ length: 20 }, (_, i) => `t${i}`);
        expect(withTags(twenty, ["one more"])).toBe(twenty);
    });

    it("returns the same list when nothing was added", () => {
        const tags = ["bar"];
        expect(withTags(tags, ["  ", "BAR"])).toBe(tags);
    });
});

describe("TagsInput", () => {
    it("adds a tag on Enter and on a comma, and removes one by its button", async () => {
        render(<Harness />);
        const input = screen.getByLabelText("Tags");

        await userEvent.type(input, "bar{Enter}terrace,");

        expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["bar", "terrace"]);
        expect(input).toHaveValue("");

        await userEvent.click(screen.getByRole("button", { name: "Remove tag bar" }));
        expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["terrace"]);
    });

    it("removes the last tag with Backspace in the empty box", async () => {
        render(<Harness initial={["bar", "terrace"]} />);

        await userEvent.type(screen.getByLabelText("Tags"), "{Backspace}");

        expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["bar"]);
    });

    it("keeps Backspace for editing while there is text", async () => {
        const onChange = vi.fn();
        render(<Harness initial={["bar"]} onChange={onChange} />);

        await userEvent.type(screen.getByLabelText("Tags"), "ab{Backspace}");

        expect(screen.getByLabelText("Tags")).toHaveValue("a");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("splits pasted lists and keeps the unfinished part", async () => {
        render(<Harness />);
        const input = screen.getByLabelText("Tags");
        input.focus();

        await userEvent.paste("bar, terrace,tech");

        expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["bar", "terrace"]);
        expect(input).toHaveValue("tech");
    });

    it("adds what was typed when the box loses focus, and ignores an empty Enter", async () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        await userEvent.type(screen.getByLabelText("Tags"), "{Enter}");
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.type(screen.getByLabelText("Tags"), "techno");
        await userEvent.tab();

        expect(onChange).toHaveBeenLastCalledWith(["techno"]);
    });

    it("stops taking tags at the limit", () => {
        render(<Harness initial={Array.from({ length: 20 }, (_, i) => `t${i}`)} />);

        expect(screen.getByLabelText("Tags")).toBeDisabled();
        expect(screen.getByLabelText("Tags")).toHaveAttribute("placeholder", "Up to 20 tags");
    });

    it("marks an invalid list", () => {
        render(<TagsInput value={[]} onChange={vi.fn()} invalid />);
        expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    });
});
