import { render, screen } from "@testing-library/react";

import { Field, FormError, Input, Select, Textarea } from "./Field";

describe("Field", () => {
    it("links the label to the control and shows the hint", () => {
        render(
            <Field label="Name" hint="Shown on the map">
                {(id) => <Input id={id} defaultValue="A38" />}
            </Field>,
        );
        const input = screen.getByLabelText("Name");
        expect(input).toHaveValue("A38");
        expect(input).toHaveClass("control");
        expect(screen.getByText("Shown on the map")).toHaveClass("hint");
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("announces errors and renders the aside", () => {
        render(
            <Field label="City" error="Required" aside={<button type="button">Detect</button>}>
                {(id) => <Input id={id} />}
            </Field>,
        );
        expect(screen.getByRole("alert")).toHaveTextContent("Required");
        expect(screen.getByRole("alert")).toHaveClass("error");
        expect(screen.getByRole("button", { name: "Detect" })).toBeInTheDocument();
        expect(screen.getByLabelText("City")).toBeInTheDocument();
    });

    it("hides an empty error", () => {
        render(
            <Field label="City" error={null}>
                {(id) => <Input id={id} />}
            </Field>,
        );
        expect(screen.queryByRole("alert")).toBeNull();
    });
});

describe("controls", () => {
    it("style inputs, textareas and selects consistently", () => {
        render(
            <>
                <Input aria-label="input" className="extra" />
                <Textarea aria-label="textarea" className="extra" />
                <Select aria-label="select" className="extra" defaultValue="b">
                    <option value="a">A</option>
                    <option value="b">B</option>
                </Select>
            </>,
        );
        expect(screen.getByRole("textbox", { name: "input" })).toHaveClass("control", "extra");
        expect(screen.getByRole("textbox", { name: "textarea" })).toHaveClass("control", "extra");
        const select = screen.getByRole("combobox", { name: "select" });
        expect(select).toHaveClass("control", "extra");
        expect(select).toHaveValue("b");
    });
});

describe("FormError", () => {
    it("renders nothing without a message", () => {
        const { container } = render(<FormError message={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("announces the message", () => {
        render(<FormError message="Saving failed" />);
        expect(screen.getByRole("alert")).toHaveTextContent("Saving failed");
    });
});
