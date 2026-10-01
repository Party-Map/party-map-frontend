// eslint-disable-next-line tsdoc/syntax
/** @type {import("stylelint").Config} */
const config = {
    extends: ["stylelint-config-standard-scss"],
    plugins: ["stylelint-declaration-strict-value"],
    rules: {
        // Colours, sizes, radii and durations come from the tokens in
        // src/styles/base.scss (var(--…), fade(…)), never as a literal.
        "scale-unlimited/declaration-strict-value": [
            ["/color$/", "fill", "stroke", "font-size", "border-radius", "transition-duration"],
            {
                ignoreValues: {
                    "/color$/": ["currentcolor", "inherit", "transparent"],
                    fill: ["none", "currentcolor", "inherit"],
                    stroke: ["none", "currentcolor", "inherit"],
                    "border-radius": ["inherit", "50%", "0", "1px"],
                    "font-size": ["inherit", "0", "/em$/"],
                },
                ignoreFunctions: true,
            },
        ],
        // Kebab-case classes (a modifier may carry a data value's underscore).
        "selector-class-pattern": ["^[a-z][a-z0-9]*(-[a-z0-9_]+)*$", { resolveNestedSelectors: true }],
        // :global(.dark) — the theme switch on <html> is the one global class a module needs.
        "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
    },
    overrides: [
        {
            // The global sheet: the theme switch, the utility classes, the token values themselves, and the
            // server-rendered shell content (markup the backend writes, see web/shell).
            files: ["src/styles/base.scss"],
            rules: {
                "selector-class-pattern": "^(dark|sr-only|pm-shell)$",
                "scale-unlimited/declaration-strict-value": null,
            },
        },
        {
            // Leaflet renders its own markup (and our pins' divIcon HTML), so these selectors are global classes.
            files: ["src/map/leaflet.scss"],
            rules: {
                "selector-class-pattern": "^(dark|leaflet-[a-z-]+|pm-[a-z0-9_-]+)$",
            },
        },
    ],
};
export default config;
