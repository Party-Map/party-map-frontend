import { render, screen } from "@testing-library/react";

import { InvitationStateLabel } from "./InvitationStateLabel";

describe("InvitationStateLabel", () => {
    it.each([
        ["ACCEPTED", "Accepted", "stateAccepted"],
        ["REJECTED", "Rejected", "stateRejected"],
        ["PENDING", "Pending", "statePending"],
    ] as const)('renders %s as "%s"', (state, text, className) => {
        render(<InvitationStateLabel state={state} />);
        expect(screen.getByText(text)).toHaveClass(className);
    });
});
