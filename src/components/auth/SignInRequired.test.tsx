import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignInRequired } from "@/components/auth/SignInRequired";
import { renderWithProviders } from "@/test/helpers";

describe("SignInRequired", () => {
    it("explains and starts the login with the return path", async () => {
        const { client } = renderWithProviders(<SignInRequired returnTo="/profile/likes" />);
        expect(await screen.findByRole("heading", { name: "Sign in required" })).toBeInTheDocument();
        expect(screen.getByText("You need to be signed in to view this page.")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Go to login" }));
        expect(client.login).toHaveBeenCalledTimes(1);
        expect(client.login).toHaveBeenCalledWith("/profile/likes");
    });

    it("accepts a custom message", async () => {
        renderWithProviders(<SignInRequired returnTo="/x" message="Sign in to like places." />);
        expect(await screen.findByText("Sign in to like places.")).toBeInTheDocument();
        expect(screen.queryByText("You need to be signed in to view this page.")).toBeNull();
    });
});
