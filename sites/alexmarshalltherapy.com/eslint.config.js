import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      // Possible Errors
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-prototype-builtins": "error",
      "no-template-curly-in-string": "error",

      // Best Practices
      eqeqeq: "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "consistent-return": "error",
      curly: ["error", "all"],
      "prefer-promise-reject-errors": "error",

      // Node.js specific
      "no-process-exit": "error",
      "no-path-concat": "error",

      // Modern JavaScript
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error"
    }
  },
  prettierConfig
];
