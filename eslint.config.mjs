import {dirname} from "path";
import {fileURLToPath} from "url";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({baseDirectory: __dirname});

const eslintConfig = [
    // Bring in Next.js + TS configs
    ...compat.extends("next/core-web-vitals", "next/typescript"),

    // Your overrides go *after* the extends
    {
        rules: {
            "@next/next/no-img-element": "off",
        },
    },
];

export default eslintConfig;
