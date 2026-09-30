import { render, screen } from "@testing-library/react";

import { InvitationStateLabel } from "./InvitationStateLabel";

describe("InvitationStateLabel", () => {
    it.each([
        ["ACCEPTED", "Accepted", "state-accepted"],
        ["REJECTED", "Rejected", "state-rejected"],
        ["PENDING", "Pending", "state-pending"],
    ] as const)('renders %s as "%s"', (state, text, className) => {
        render(<InvitationStateLabel state={state} />);
        expect(screen.getByText(text)).toHaveClass(className);
    });
});
