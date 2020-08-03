module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint",
    "prettier/react",
    "react-app",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["prettier", "react", "@typescript-eslint"],
  rules: {
    "no-console": "warn",
    // we have a lot of anonymous renderers passed as props
    "react/display-name": "off",
    // I care more about readibility than possible errors
    "react/no-unescaped-entities": "off",
    // typescript will take care of this for me
    "react/prop-types": "off",
    // This is too annoying for a personal project
    "@typescript-eslint/no-explicit-any": "off",
    // Want to enable this, but will take lots of fiddling
    "@typescript-eslint/explicit-function-return-type": "off",
    // Lots of places where we use ! for simplicity
    "@typescript-eslint/no-non-null-assertion": "off",
    // idk why this is a rule, it's better than importing lodash/noop
    "@typescript-eslint/no-empty-function": "off",
    // We use `require()` for jest imports
    "@typescript-eslint/no-var-requires": "off",
    // Enabled only for parameters with defaults for clarity
    "@typescript-eslint/no-inferrable-types": [
      "error",
      { ignoreParameters: true },
    ],
  },
}
