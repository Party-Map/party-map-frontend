import { fixupConfigRules } from "@eslint/compat";
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importSort from "eslint-plugin-simple-import-sort";
import tsdoc from "eslint-plugin-tsdoc";
import tseslint from "typescript-eslint";

import boundaries from "./boundaries.config.js";

const eslintConfig = defineConfig([
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    reactHooks.configs.flat.recommended,
    // eslint-plugin-react and jsx-a11y still call context methods eslint 10 removed; @eslint/compat restores them.
    fixupConfigRules([react.configs.flat.recommended, react.configs.flat["jsx-runtime"], jsxA11y.flatConfigs.recommended]),
    prettier,
    ...boundaries,
    globalIgnores([
        "dist/**",
        ".rsbuild/**",
        "coverage/**",
        "playwright-report/**",
        "e2e/.results/**",
        "e2e/.shots/**",
        "src/api/schema.d.ts",
        "src/**/*.module.scss.d.ts",
    ]),
    // The config files and scripts are plain JavaScript run by Node: no types to check them against.
    {
        files: ["*.js", "*.mjs", "scripts/*.mjs"],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: { globals: { process: "readonly", console: "readonly" } },
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["*.js", "*.mjs", "scripts/*.mjs"],
                },
            },
        },
        settings: {
            react: { version: "detect" },
        },
        plugins: {
            "simple-import-sort": importSort,
            tsdoc,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
            "tsdoc/syntax": "error",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            // Arrow callbacks such as onClick={() => setOpen(false)} are the React idiom.
            "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
            // Numbers, booleans and nullish values read fine in a template string.
            "@typescript-eslint/restrict-template-expressions": [
                "error",
                { allowNumber: true, allowBoolean: true, allowNullish: true },
            ],
            // `text || fallback` is deliberate where the empty string counts as absent.
            "@typescript-eslint/prefer-nullish-coalescing": [
                "error",
                { ignorePrimitives: { string: true, boolean: true } },
            ],
            "jsx-a11y/no-autofocus": "off",
            "no-console": ["error", { allow: ["warn", "error"] }],
            eqeqeq: ["error", "always"],
        },
    },
    // Tests hand vi.fn() mocks around as methods and assert on values they just created.
    {
        files: ["src/**/*.test.{ts,tsx}", "src/test/**", "e2e/**"],
        rules: {
            "@typescript-eslint/unbound-method": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
]);

export default eslintConfig;
