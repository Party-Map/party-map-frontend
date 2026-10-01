import { expect, type Page, test } from "@playwright/test";

// The admin area against the dev stack (backend dev profile + Keycloak), signed in as e2e@partymap.local, who holds
// every manager role and partymap_admin. Created rows carry a run id; the dev profile recreates the schema on restart.

const run = Date.now().toString(36);

async function next(page: Page, name = "Next") {
    await page.getByRole("button", { name }).click();
}

test("the shell switches between the domains the user's roles unlock", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/places$/);
    const sections = page.getByRole("navigation", { name: "Admin sections" });
    await expect(sections.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: /Switch domain/ }).click();
    const items = page.getByRole("menuitem");
    await expect(items).toHaveText([/Places/, /Performers/, /Events/, /Platform/]);
    await items.filter({ hasText: "Events" }).click();

    await expect(page).toHaveURL(/\/admin\/events$/);
    await expect(page.getByRole("heading", { level: 1, name: "Events" })).toBeVisible();
    await sections.getByRole("link", { name: "Event plans" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Event plans" })).toBeVisible();
});

test.describe("signing in from a deep link", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("returns to the admin page that was asked for", async ({ page }) => {
        await page.goto("/admin/events/plans");
        await page.getByRole("button", { name: "Go to login" }).click();
        await page.locator("#username").fill(process.env.E2E_USER ?? "e2e@partymap.local");
        await page.locator("#password").fill(process.env.E2E_PASSWORD ?? "e2e-password");
        await page.locator("#kc-login").click();

        await expect(page).toHaveURL(/\/admin\/events\/plans$/);
        await expect(page.getByRole("heading", { level: 1, name: "Event plans" })).toBeVisible();
    });
});

test("an organizer plans an event with a venue and a performer and publishes it", async ({ page }) => {
    test.setTimeout(90_000);
    const venue = `E2E Venue ${run}`;
    const artist = `E2E Artist ${run}`;
    const night = `E2E Night ${run}`;

    // A place, through its wizard (the e2e user is also its manager).
    await page.goto("/admin/places/new");
    await next(page);
    await expect(page.getByText("Name is required.")).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill(venue);
    await page.getByLabel("Tags", { exact: true }).fill("e2e,");
    await next(page);
    await page.getByLabel("City").fill("Budapest");
    await page.locator(".leaflet-container").click({ position: { x: 160, y: 120 } });
    await expect(page.getByText(/^Lat \d/)).toBeVisible();
    await next(page);
    await next(page, "Continue to review");
    await expect(page.getByRole("region", { name: "Basics" })).toContainText(venue);
    await next(page, "Create place");
    await expect(page.getByRole("heading", { level: 1, name: venue })).toBeVisible();

    // The new place has its own area: chosen in the header, its own sections, its public page in a new tab.
    await expect(page.getByRole("button", { name: `Place: ${venue}. Switch place` })).toBeVisible();
    const sections = page.getByRole("navigation", { name: "Admin sections" });
    await expect(sections.getByRole("link", { name: "All places" })).toBeVisible();
    const [publicPage] = await Promise.all([
        page.context().waitForEvent("page"),
        page
            .getByRole("link", { name: /View public page/ })
            .first()
            .click(),
    ]);
    await expect(publicPage).toHaveURL(/\/places\/[0-9a-f-]+$/);
    await publicPage.close();
    await expect(page.getByRole("heading", { level: 1, name: venue })).toBeVisible();

    // A performer.
    await page.goto("/admin/performers/new");
    await page.getByLabel("Name", { exact: true }).fill(artist);
    await page.getByLabel("Genre").fill("techno");
    await next(page);
    await next(page, "Continue to review");
    await next(page, "Create performer");
    await expect(page.getByRole("heading", { level: 1, name: artist })).toBeVisible();

    // The plan, then its workspace.
    await page.goto("/admin/events/plans/new");
    await page.getByLabel("Title").fill(night);
    await page.getByLabel("Kind").selectOption("TECHNO");
    await next(page);
    await page.getByLabel("Start").fill("2031-06-01T22:00");
    await page.getByLabel("End").fill("2031-06-02T04:00");
    await page.getByLabel("Entry price").fill("2000");
    await next(page);
    await next(page, "Continue to review");
    await next(page, "Create event plan");
    await expect(page.getByRole("heading", { name: "Venue" })).toBeVisible();
    const workspace = page.url();
    await expect(page.getByRole("button", { name: "Publish" })).toBeDisabled();

    await page.getByLabel("Place").selectOption({ label: `${venue}, Budapest` });
    await page.getByRole("button", { name: "Send invitation" }).first().click();
    await expect(page.getByText(`Waiting for ${venue} to answer.`)).toBeVisible();
    await page.getByLabel("Performer").selectOption({ label: `${artist} (techno)` });
    await page.getByRole("button", { name: "Send invitation" }).last().click();
    await expect(page.getByRole("list", { name: "Invited performers" })).toContainText(artist);

    // Both managers answer (the same user holds those roles too).
    await page.goto("/admin/places/requests");
    await page.getByRole("button", { name: `Accept ${night} for ${venue}` }).click();
    await expect(page.getByText("Invitation accepted.")).toBeVisible();
    await page.goto("/admin/performers/requests");
    await page.getByRole("button", { name: `Accept ${night} for ${artist}` }).click();
    await expect(page.getByText("Invitation accepted.")).toBeVisible();

    await page.goto(workspace);
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Publish" }).click();

    await expect(page).toHaveURL(/\/admin\/events\/live$/);
    await expect(page.getByRole("link", { name: night })).toBeVisible();
});

test("a platform admin grants and revokes a manager role", async ({ page }) => {
    await page.goto("/admin/platform/users");
    await page.getByRole("searchbox", { name: "Search users" }).fill("roles-target");
    await expect(page).toHaveURL(/q=roles-target/);
    await page.getByRole("link", { name: /Roles Target/ }).click();

    const performerRole = page.getByRole("switch", { name: "Performer manager" });
    await expect(performerRole).not.toBeChecked();
    await performerRole.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Grant role" }).click();
    await expect(page.getByText("Performer manager granted to Roles Target.")).toBeVisible();
    await expect(performerRole).toBeChecked();

    // Leave the dev realm as it was.
    await performerRole.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Revoke role" }).click();
    await expect(page.getByText("Performer manager revoked from Roles Target.")).toBeVisible();
    await expect(performerRole).not.toBeChecked();

    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL(/\/admin\/platform\/users\?q=roles-target$/);
});
