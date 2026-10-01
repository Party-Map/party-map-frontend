import { expect, test } from "@playwright/test";

const EVENT = "/events/50bf3153-7d1c-51d2-9bb7-cc81432d7311";

test("a detail page arrives server-rendered with its metadata and the app needs no first fetch", async ({
    page,
    request,
}) => {
    const response = await request.get(EVENT, { headers: { Accept: "text/html" } });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('property="og:title" content="Buli a pincébe');
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('id="pm-data"');
    expect(html).toContain(`<link rel="canonical" href="http://localhost:3000${EVENT}"`);

    const eventRequests: string[] = [];
    page.on("request", (sent) => {
        if (sent.url().includes("/api/events/50bf3153")) eventRequests.push(sent.url());
    });
    await page.goto(EVENT);
    await expect(page.getByRole("heading", { level: 1, name: "Buli a pincébe" })).toBeVisible();
    await expect(page).toHaveTitle(/Buli a pincébe/);
    expect(eventRequests).toEqual([]);
});

test("an unknown id answers 404 and the app's not-found page", async ({ page, request }) => {
    const missing = "/events/00000000-0000-0000-0000-000000000000";
    const response = await request.get(missing, { headers: { Accept: "text/html" } });
    expect(response.status()).toBe(404);
    expect(response.headers()["x-robots-tag"]).toBe("noindex");
    await page.goto(missing);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("the sitemap is served", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("<urlset");
});
