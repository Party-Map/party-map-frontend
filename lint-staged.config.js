// eslint-disable-next-line tsdoc/syntax
/** @type {import("lint-staged").Configuration} */
const config = {
    "*.{css,scss}": ["stylelint --fix", "prettier --write"],
    "*.{js,mjs,ts,tsx}": ["eslint --fix", "prettier --write"],
    "!(*.css|*.scss|*.js|*.mjs|*.ts|*.tsx)": ["prettier --ignore-unknown --write"],
};
export default config;
