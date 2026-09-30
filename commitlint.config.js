// eslint-disable-next-line tsdoc/syntax
/** @type {import("@commitlint/types").UserConfig} */
const config = {
    extends: ["@commitlint/config-conventional"],
    rules: {
        // The project writes scopes capitalised: feat(Build): ..., fix(Cors): ...
        "scope-case": [0],
    },
};
export default config;
