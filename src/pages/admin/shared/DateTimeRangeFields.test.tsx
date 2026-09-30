import { fireEvent, screen } from "@testing-library/react";

import { renderWithProviders } from "@/test/helpers";

import { DateTimeRangeFields } from "./DateTimeRangeFields";

describe("DateTimeRangeFields", () => {
    it("renders both datetime-local inputs with their bounds", () => {
        renderWithProviders(
            <DateTimeRangeFields
                start="2030-06-01T20:00"
                end="2030-06-02T02:00"
                onChange={() => {}}
                min="2030-06-01T18:00"
                max="2030-06-02T06:00"
            />,
        );
        const start = screen.getByLabelText("Start");
        const end = screen.getByLabelText("End");
        expect(start).toHaveAttribute("type", "datetime-local");
        expect(start).toHaveValue("2030-06-01T20:00");
        expect(end).toHaveValue("2030-06-02T02:00");
        expect(start).toHaveAttribute("min", "2030-06-01T18:00");
        expect(end).toHaveAttribute("max", "2030-06-02T06:00");
        expect(start).toBeRequired();
        expect(start).toBeEnabled();
    });

    it("reports the changed side together with the other value", () => {
        const onChange = vi.fn();
        renderWithProviders(
            <DateTimeRangeFields start="2030-06-01T20:00" end="2030-06-02T02:00" onChange={onChange} />,
        );

        fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2030-06-01T21:00" } });
        expect(onChange).toHaveBeenLastCalledWith("2030-06-01T21:00", "2030-06-02T02:00");

        fireEvent.change(screen.getByLabelText("End"), { target: { value: "2030-06-02T03:00" } });
        expect(onChange).toHaveBeenLastCalledWith("2030-06-01T20:00", "2030-06-02T03:00");
    });

    it("can be disabled", () => {
        renderWithProviders(<DateTimeRangeFields start="" end="" onChange={() => {}} disabled />);
        expect(screen.getByLabelText("Start")).toBeDisabled();
        expect(screen.getByLabelText("End")).toBeDisabled();
    });
});
