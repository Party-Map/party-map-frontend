import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Role } from "@/auth/roles";
import { performer } from "@/test/fixtures";
import { authenticatedSnapshot, mockApi, renderWithProviders, requestBody } from "@/test/helpers";

import { NewPerformerPage } from "./NewPerformerPage";

function renderPage(auth = authenticatedSnapshot([Role.PERFORMER_MANAGER])) {
    return renderWithProviders(<NewPerformerPage />, {
        route: "/admin/performers/new",
        path: "/admin/performers/new",
        auth,
        dataRouter: true,
    });
}

describe("NewPerformerPage", () => {
    it("sends anonymous visitors to login", async () => {
        const { client } = renderWithProviders(<NewPerformerPage />, {
            route: "/admin/performers/new",
            path: "/admin/performers/new",
            dataRouter: true,
        });
        await waitFor(() => expect(client.login).toHaveBeenCalledWith("/admin/performers/new"));
    });

    it("shows the 404 page to users without the performer manager role", async () => {
        renderPage(authenticatedSnapshot([Role.PLACE_MANAGER]));
        expect(await screen.findByText("404")).toBeInTheDocument();
    });

    it("needs a name and a genre before the next step", async () => {
        mockApi({});
        renderPage();

        await userEvent.click(await screen.findByRole("button", { name: "Next" }));

        expect(await screen.findByText("Name is required.")).toBeInTheDocument();
        expect(screen.getByText("Genre is required.")).toBeInTheDocument();
    });

    it("creates the performer and opens its admin page", async () => {
        const fetchMock = mockApi({ "POST /api/performers": { ...performer, id: "performer-9" } });
        renderPage();

        await userEvent.type(await screen.findByLabelText("Name"), " DJ New ");
        await userEvent.type(screen.getByLabelText("Genre"), "house");
        await userEvent.type(screen.getByLabelText("Bio"), "Deep cuts.");
        await userEvent.click(screen.getByRole("button", { name: "Next" }));
        await userEvent.type(await screen.findByLabelText("Profile image URL"), "not a url");
        await userEvent.click(screen.getByRole("button", { name: "Continue to review" }));
        expect(await screen.findByText("Enter a full http(s) address, or leave it empty.")).toBeInTheDocument();

        await userEvent.clear(screen.getByLabelText("Profile image URL"));
        await userEvent.click(screen.getByRole("button", { name: "Continue to review" }));
        await userEvent.click(await screen.findByRole("button", { name: "Create performer" }));

        expect(await screen.findByText("other page")).toBeInTheDocument();
        expect(screen.getByText("Performer created.")).toBeInTheDocument();
        expect(requestBody(fetchMock, 0)).toEqual({ name: "DJ New", genre: "house", bio: "Deep cuts.", image: null });
    });
});
