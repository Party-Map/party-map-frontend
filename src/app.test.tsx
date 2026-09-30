import { render, screen } from "@testing-library/react";

import { authenticatedSnapshot, createMockAuthClient } from "@/test/helpers";

import { App } from "./app";

// The real route table pulls in every feature; a single probe route is enough to prove App wires
// the providers around the router. The factory is hoisted above the JSX runtime import, so it
// builds its elements with createElement.
vi.mock("./routes", async () => {
    const { createElement } = await import("react");
    const { createMemoryRouter } = await import("react-router");
    const { useHighlight } = await import("@/layout/HighlightProvider");
    const { useTheme } = await import("@/lib/theme");
    const { useAuth } = await import("@/auth/provider");

    function Probe() {
        const { status } = useAuth();
        const { theme } = useTheme();
        const { highlightIds } = useHighlight();
        return createElement("p", null, `auth=${status} theme=${theme} highlights=${highlightIds.length}`);
    }

    return { router: createMemoryRouter([{ path: "/", element: createElement(Probe) }]) };
});

describe("App", () => {
    it("mounts the router inside the auth, query and highlight providers", async () => {
        render(<App authClient={createMockAuthClient(authenticatedSnapshot())} />);
        expect(await screen.findByText("auth=authenticated theme=light highlights=0")).toBeInTheDocument();
    });
});
