import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

/**
 * Logs in through Keycloak once (PKCE redirect flow) and stores the resulting browser state, with the cookie notice
 * already answered (like the anonymous state files) so it never covers a page. Needs E2E_USER and E2E_PASSWORD for a
 * realm user; the dev realm ships `e2e@partymap.local` / `e2e-password` with every manager role and partymap_admin.
 */
setup("authenticate", async ({ page }) => {
    const user = process.env.E2E_USER ?? "e2e@partymap.local";
    const password = process.env.E2E_PASSWORD ?? "e2e-password";

    await page.goto("/profile");
    await page.getByRole("button", { name: "Go to login" }).click();
    await page.locator("#username").fill(user);
    await page.locator("#password").fill(password);
    await page.locator("#kc-login").click();

    await page.waitForURL("**/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await page.evaluate(() => localStorage.setItem("pm:consent:v1", JSON.stringify({ t: 1, v: 1 })));
    await page.context().storageState({ path: AUTH_FILE });
});
