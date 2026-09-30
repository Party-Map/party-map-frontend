import { render, screen } from "@testing-library/react";
import { App } from "@/app/App";
import { authenticatedSnapshot, createMockAuthClient } from "@/test/helpers";

// The real route table pulls in every feature; a single probe route is enough to prove App wires
// the providers around the router. The factory is hoisted above the JSX runtime import, so it
// builds its elements with createElement.
vi.mock("@/app/router", async () => {
    const { createElement } = await import("react");
    const { createMemoryRouter } = await import("react-router");
    const { useHighlight } = await import("@/app/HighlightProvider");
    const { useTheme } = await import("@/app/ThemeProvider");
    const { useToast } = await import("@/app/ToastProvider");
    const { useAuth } = await import("@/lib/auth/AuthProvider");

    function Probe() {
        const { status } = useAuth();
        const { theme } = useTheme();
        const { highlightIds } = useHighlight();
        useToast();
        return createElement("p", null, `auth=${status} theme=${theme} highlights=${highlightIds.length}`);
    }

    return { router: createMemoryRouter([{ path: "/", element: createElement(Probe) }]) };
});

describe("App", () => {
    it("mounts the router inside the theme, toast, auth and highlight providers", async () => {
        render(<App authClient={createMockAuthClient(authenticatedSnapshot())} />);
        expect(await screen.findByText("auth=authenticated theme=light highlights=0")).toBeInTheDocument();
    });
});
