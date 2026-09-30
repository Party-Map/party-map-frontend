import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import { LikeButton } from "@/components/LikeButton";
import type { AuthSnapshot } from "@/lib/auth/keycloak";
import { ANONYMOUS, authenticatedSnapshot, mockApi, renderWithProviders } from "@/test/helpers";

type Props = ComponentProps<typeof LikeButton>;

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

function renderLike(props: Partial<Props> = {}, auth: AuthSnapshot = authenticatedSnapshot()) {
    return renderWithProviders(
        <LikeButton target="events" targetId="event-1" targetName="Techno Night" initialLiked={false} {...props} />,
        {
            auth,
        },
    );
}

function sentRequest(index = 0) {
    const call = (globalThis.fetch as unknown as { mock: { calls: [unknown, RequestInit | undefined][] } }).mock.calls[
        index
    ];
    if (!call) throw new Error(`fetch call ${index} is missing`);
    return `${call[1]?.method ?? "GET"} ${String(call[0])}`;
}

describe("LikeButton", () => {
    it("renders nothing for anonymous visitors", async () => {
        renderLike({}, ANONYMOUS);
        await act(async () => {});
        expect(screen.queryByRole("button")).toBeNull();
    });

    it("likes the target, notifies and toasts", async () => {
        const fetchMock = mockApi({ "PUT /api/me/likes/events/event-1": { liked: true } });
        const onChange = vi.fn();
        renderLike({ onChange });
        const button = await screen.findByRole("button", { name: "Add to favorites" });
        expect(button).toHaveAttribute("aria-pressed", "false");

        await userEvent.click(button);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(sentRequest()).toBe("PUT http://api.test/api/me/likes/events/event-1");
        expect(await screen.findByRole("status")).toHaveTextContent("You liked Techno Night");
        expect(screen.getByRole("button", { name: "Remove from favorites" })).toHaveAttribute("aria-pressed", "true");
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it("unlikes a liked target", async () => {
        mockApi({ "DELETE /api/me/likes/places/place-1": { liked: false } });
        const onChange = vi.fn();
        renderLike({ target: "places", targetId: "place-1", targetName: "A38 Hajó", initialLiked: true, onChange });
        const button = await screen.findByRole("button", { name: "Remove from favorites" });
        expect(button).toHaveAttribute("aria-pressed", "true");

        await userEvent.click(button);
        expect(sentRequest()).toBe("DELETE http://api.test/api/me/likes/places/place-1");
        expect(await screen.findByRole("status")).toHaveTextContent("You broke up with A38 Hajó");
        expect(screen.getByRole("button", { name: "Add to favorites" })).toHaveAttribute("aria-pressed", "false");
        expect(onChange).toHaveBeenCalledWith(false);
    });

    it("keeps the state and shows an error toast when the request fails", async () => {
        mockApi({});
        const onChange = vi.fn();
        renderLike({ onChange });
        const button = await screen.findByRole("button", { name: "Add to favorites" });
        await userEvent.click(button);
        expect(await screen.findByRole("status")).toHaveTextContent("Could not update your likes. Please try again.");
        expect(button).toHaveAttribute("aria-pressed", "false");
        expect(button).toBeEnabled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("shows a broken heart while hovering a liked target", async () => {
        renderLike({ initialLiked: true, className: "extra" });
        const button = await screen.findByRole("button", { name: "Remove from favorites" });
        expect(button).toHaveClass("button", "extra");
        expect(button.querySelector("svg")?.getAttribute("class")).not.toMatch(/heart-crack/);
        expect(button.querySelector("svg")).toHaveAttribute("fill", "currentColor");

        await userEvent.hover(button);
        expect(button.querySelector("svg")?.getAttribute("class")).toMatch(/heart-crack/);
        await userEvent.unhover(button);
        expect(button.querySelector("svg")?.getAttribute("class")).not.toMatch(/heart-crack/);
    });

    it("does not break the heart when hovering an unliked target", async () => {
        renderLike();
        const button = await screen.findByRole("button", { name: "Add to favorites" });
        await userEvent.hover(button);
        expect(button.querySelector("svg")?.getAttribute("class")).not.toMatch(/heart-crack/);
        expect(button.querySelector("svg")).toHaveAttribute("fill", "none");
    });

    it("is disabled while a request is in flight", async () => {
        const pending = deferred<Response>();
        const fetchMock = vi.fn(() => pending.promise);
        vi.stubGlobal("fetch", fetchMock);
        renderLike();
        const button = await screen.findByRole("button", { name: "Add to favorites" });

        await userEvent.click(button);
        expect(button).toBeDisabled();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await act(async () => pending.resolve(new Response(JSON.stringify({ liked: true }), { status: 200 })));
        await waitFor(() => expect(button).toBeEnabled());
        expect(button).toHaveAttribute("aria-pressed", "true");
    });
});
