import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderWithProviders } from "@/test/helpers";
import { ImageUrlField } from "./ImageUrlField";

function Harness({ initial = "", label }: { initial?: string; label?: string }) {
    const [value, setValue] = useState(initial);
    return <ImageUrlField value={value} onChange={setValue} {...(label ? { label } : {})} />;
}

describe("ImageUrlField", () => {
    it("renders a url input with a hint and no preview while empty", () => {
        renderWithProviders(<Harness />);
        const input = screen.getByLabelText("Cover image URL");
        expect(input).toHaveAttribute("type", "url");
        expect(input).toHaveValue("");
        expect(screen.getByText("Paste a link to a JPG, PNG or WEBP image.")).toBeInTheDocument();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("previews the image once a url is typed", async () => {
        renderWithProviders(<Harness />);
        await userEvent.type(screen.getByLabelText("Cover image URL"), "https://images.example/a.jpg");

        expect(screen.getByLabelText("Cover image URL")).toHaveValue("https://images.example/a.jpg");
        expect(screen.getByRole("img", { name: "Cover preview" })).toHaveAttribute(
            "src",
            "https://images.example/a.jpg",
        );
    });

    it("hides the preview for whitespace-only values and accepts a custom label", async () => {
        renderWithProviders(<Harness initial="https://images.example/a.jpg" label="Profile image URL" />);
        expect(screen.getByRole("img", { name: "Cover preview" })).toBeInTheDocument();

        await userEvent.clear(screen.getByLabelText("Profile image URL"));
        await userEvent.type(screen.getByLabelText("Profile image URL"), "   ");
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
});
