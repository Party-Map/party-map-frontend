// eslint.config.mjs
import {defineConfig, globalIgnores} from "eslint/config"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

export default defineConfig([
    // Next.js core-web-vitals preset (includes React, TS support, etc.)
    ...nextCoreWebVitals,

    // Optional: override default ignores (this is the snippet from Next docs)
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),

    // Your custom overrides
    {
        rules: {
            "@next/next/no-img-element": "off",
        },
    },
])
