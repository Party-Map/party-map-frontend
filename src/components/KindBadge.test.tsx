import { render, screen } from "@testing-library/react";

import { EVENT_TYPES } from "@/api/types";
import { EVENT_TYPE_LABELS } from "@/lib/constants";

import { KindBadge } from "./KindBadge";

describe("KindBadge", () => {
    it.each(EVENT_TYPES)("labels %s and exposes the kind for styling", (kind) => {
        render(<KindBadge kind={kind} />);
        const badge = screen.getByText(EVENT_TYPE_LABELS[kind]);
        expect(badge).toHaveAttribute("data-kind", kind);
        expect(badge).toHaveClass("badge", "md");
    });

    it("supports the small size and extra classes", () => {
        render(<KindBadge kind="HOME" size="sm" className="extra" />);
        const badge = screen.getByText("House Party");
        expect(badge).toHaveClass("badge", "sm", "extra");
        expect(badge).not.toHaveClass("md");
    });
});
