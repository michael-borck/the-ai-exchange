module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-hooks", "@typescript-eslint", "prettier"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    // Return-type annotations are intentionally NOT enforced. TypeScript
    // infers and type-checks every return type already; requiring explicit
    // annotations on React components (`: JSX.Element`) and hooks (verbose
    // TanStack query types) is noise that fights the framework's idioms.
    // Standard React/Vite/Next practice ships this rule off. Note: a typo
    // ("explicit-function-return-types", plural) silently disabled this for
    // months with zero noticed impact — confirming it wasn't earning its
    // keep. `no-explicit-any` below stays on; that one catches real holes.
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "prettier/prettier": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      env: {
        node: true,
      },
    },
  ],
};
