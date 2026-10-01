import { render, screen } from "@testing-library/react";

import { InvitationStateChip, StatusChip } from "./StatusChip";

describe("StatusChip", () => {
    it.each(["neutral", "success", "danger", "warning", "info"] as const)("has the %s tone", (tone) => {
        render(<StatusChip tone={tone}>Label</StatusChip>);
        expect(screen.getByText("Label")).toHaveClass("chip", tone);
    });

    it("is neutral by default", () => {
        render(<StatusChip>Label</StatusChip>);
        expect(screen.getByText("Label")).toHaveClass("neutral");
    });

    it.each([
        ["PENDING", "Pending", "warning"],
        ["ACCEPTED", "Accepted", "success"],
        ["REJECTED", "Rejected", "danger"],
    ] as const)("shows the %s invitation state", (state, label, tone) => {
        render(<InvitationStateChip state={state} />);
        expect(screen.getByText(label)).toHaveClass(tone);
    });
});
