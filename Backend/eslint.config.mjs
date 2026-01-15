import js from "@eslint/js";
import globals from "globals"

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      // 1. Tell ESLint to allow 'require' and 'module.exports'
      sourceType: "commonjs", 
      globals: {
        // 2. Load all Node.js global variables (process, __dirname, etc.)
        ...globals.node, 
      },
    },
    rules: {
      "no-console": "off", // Usually allowed in backend projects
      "no-undef": "error",
    },
  },
];