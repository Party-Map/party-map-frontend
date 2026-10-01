import { render, screen } from "@testing-library/react";

import { PublishChecklist } from "./PublishChecklist";

const item = (done: boolean) => ({ id: "venue" as const, label: "A venue accepted", done, hint: "Hint." });

describe("PublishChecklist", () => {
    it("marks what is missing", () => {
        render(<PublishChecklist readiness={{ ready: false, items: [item(false)], confirmed: 0 }} />);

        expect(screen.getByText("Not yet")).toBeInTheDocument();
        expect(screen.getByText(": not yet")).toBeInTheDocument();
        expect(screen.getByText(/without a lineup/)).toBeInTheDocument();
    });

    it("says when the plan is ready and how many performers will play", () => {
        const { rerender } = render(
            <PublishChecklist readiness={{ ready: true, items: [item(true)], confirmed: 1 }} />,
        );
        expect(screen.getByText("Ready")).toBeInTheDocument();
        expect(screen.getByText(": done")).toBeInTheDocument();
        expect(screen.getByText(/with 1 confirmed performer\./)).toBeInTheDocument();

        rerender(<PublishChecklist readiness={{ ready: true, items: [item(true)], confirmed: 3 }} />);
        expect(screen.getByText(/with 3 confirmed performers\./)).toBeInTheDocument();
    });
});
