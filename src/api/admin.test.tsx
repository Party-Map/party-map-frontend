import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { adminUser, adminUserPage } from "@/test/fixtures";
import { AppProviders, createTestQueryClient, mockApi } from "@/test/helpers";

import { fetchAdminUser, fetchAdminUsers, grantRole, revokeRole } from "./admin";
import { useAdminUser, useAdminUsers, useChangeUserRole } from "./hooks";
import { adminKeys } from "./keys";

const BASE = "http://api.test/api";

describe("admin api", () => {
    it("lists users with the search and the page, leaving out an empty search", async () => {
        const fetchMock = mockApi({
            "GET /api/admin/users?q=jane&page=1&size=20": adminUserPage,
            "GET /api/admin/users?page=0&size=50": adminUserPage,
        });

        await expect(fetchAdminUsers({ q: "jane", page: 1, size: 20 })).resolves.toEqual(adminUserPage);
        await expect(fetchAdminUsers({ q: "", page: 0, size: 50 })).resolves.toEqual(adminUserPage);

        expect(fetchMock.requests.map((r) => r.url)).toEqual([
            `${BASE}/admin/users?q=jane&page=1&size=20`,
            `${BASE}/admin/users?page=0&size=50`,
        ]);
    });

    it("reads one user and grants and revokes manager roles", async () => {
        const fetchMock = mockApi({
            "GET /api/admin/users/user-1": adminUser,
            "PUT /api/admin/users/user-1/roles/event_organizer_user": null,
            "DELETE /api/admin/users/user-1/roles/place_manager_user": null,
        });

        await expect(fetchAdminUser("user-1")).resolves.toEqual(adminUser);
        await grantRole("user-1", "event_organizer_user");
        await revokeRole("user-1", "place_manager_user");

        expect(fetchMock.requests.map((r) => `${r.method} ${r.url}`)).toEqual([
            `GET ${BASE}/admin/users/user-1`,
            `PUT ${BASE}/admin/users/user-1/roles/event_organizer_user`,
            `DELETE ${BASE}/admin/users/user-1/roles/place_manager_user`,
        ]);
    });
});

describe("admin hooks", () => {
    function setup() {
        const queryClient = createTestQueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <AppProviders queryClient={queryClient}>{children}</AppProviders>
        );
        return { queryClient, wrapper };
    }

    it("load a page of users and one user", async () => {
        mockApi({
            "GET /api/admin/users?q=ja&page=0&size=20": adminUserPage,
            "GET /api/admin/users/user-1": adminUser,
        });
        const { wrapper } = setup();

        const list = renderHook(() => useAdminUsers({ q: "ja", page: 0, size: 20 }), { wrapper });
        const one = renderHook(() => useAdminUser("user-1"), { wrapper });

        await waitFor(() => expect(list.result.current.data).toEqual(adminUserPage));
        await waitFor(() => expect(one.result.current.data).toEqual(adminUser));
    });

    it("grant or revoke a role and refresh every user query", async () => {
        const fetchMock = mockApi({
            "PUT /api/admin/users/user-1/roles/performer_manager_user": null,
            "DELETE /api/admin/users/user-1/roles/performer_manager_user": null,
        });
        const { queryClient, wrapper } = setup();
        const invalidate = vi.spyOn(queryClient, "invalidateQueries");
        const { result } = renderHook(() => useChangeUserRole("user-1"), { wrapper });

        await result.current.mutateAsync({ role: "performer_manager_user", grant: true });
        await result.current.mutateAsync({ role: "performer_manager_user", grant: false });

        expect(fetchMock.requests.map((r) => r.method)).toEqual(["PUT", "DELETE"]);
        expect(invalidate).toHaveBeenCalledWith({ queryKey: adminKeys.users() });
    });

    it("key user lists by search and page", () => {
        expect(adminKeys.userList({ page: 2, size: 20 })).toEqual(["admin", "users", "list", "", 2, 20]);
        expect(adminKeys.user("u")).toEqual(["admin", "users", "detail", "u"]);
    });
});
