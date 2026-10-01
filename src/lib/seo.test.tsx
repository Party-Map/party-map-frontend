import { render } from "@testing-library/react";

import { applyPageMeta, DEFAULT_META, pageTitle, usePageMeta } from "./seo";

const head = (selector: string, attribute = "content") =>
    document.head.querySelector(selector)?.getAttribute(attribute);

describe("applyPageMeta", () => {
    afterEach(() => applyPageMeta(document, null));

    it("writes the title, description, canonical, Open Graph, Twitter and robots tags, then restores the defaults", () => {
        applyPageMeta(document, {
            title: pageTitle("Techno Night"),
            description: "All night long.",
            canonicalPath: "/events/event-1",
            image: "https://images.example/night.jpg",
            noindex: true,
        });
        expect(document.title).toBe("Techno Night | PartyMap");
        expect(head('meta[name="description"]')).toBe("All night long.");
        expect(head('link[rel="canonical"]', "href")).toBe("http://localhost:3000/events/event-1");
        expect(head('meta[property="og:title"]')).toBe("Techno Night | PartyMap");
        expect(head('meta[property="og:url"]')).toBe("http://localhost:3000/events/event-1");
        expect(head('meta[property="og:image"]')).toBe("https://images.example/night.jpg");
        expect(head('meta[name="twitter:image"]')).toBe("https://images.example/night.jpg");
        expect(head('meta[name="robots"]')).toBe("noindex");

        applyPageMeta(document, { title: "Browse | PartyMap" });
        expect(document.title).toBe("Browse | PartyMap");
        expect(head('meta[name="description"]')).toBe(DEFAULT_META.description);
        expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
        expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
        expect(document.head.querySelector('meta[name="robots"]')).toBeNull();

        applyPageMeta(document, null);
        expect(document.title).toBe("PartyMap");
    });
});

describe("usePageMeta", () => {
    function Probe({ title }: { title: string | null }) {
        usePageMeta(title ? { title, canonicalPath: "/places/place-1" } : null);
        return null;
    }

    it("applies the metadata while mounted and leaves the head alone while the page has none yet", () => {
        const { rerender, unmount } = render(<Probe title={null} />);
        expect(document.title).toBe("PartyMap");
        rerender(<Probe title="A38 | PartyMap" />);
        expect(document.title).toBe("A38 | PartyMap");
        expect(head('link[rel="canonical"]', "href")).toBe("http://localhost:3000/places/place-1");
        unmount();
        expect(document.title).toBe("PartyMap");
        expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    });
});
