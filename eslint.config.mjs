import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "vendor/**",
      "generated/**",
      "*.min.*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["src/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          "assertionStyle": "as",
          "objectLiteralTypeAssertions": "never",
          "arrayLiteralTypeAssertions": "never"
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          "selector": "TSEnumDeclaration",
          "message": "Prefer literal unions or domain classes. Enums create runtime/type ambiguity unless explicitly approved."
        }
      ]
    },
  },
  {
    files: ["src/core/**/*.ts", "src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            { "name": "fs", "message": "Core must use a port, not the filesystem." },
            { "name": "fs/promises", "message": "Core must use a port, not the filesystem." },
            { "name": "path", "message": "Core must not depend on host path semantics." },
            { "name": "crypto", "message": "Core must use UuidPort/RandomPort, not crypto directly." },
            { "name": "http", "message": "Core must use a port, not network APIs." },
            { "name": "https", "message": "Core must use a port, not network APIs." },
            { "name": "os", "message": "Core must not depend on host OS APIs." },
            { "name": "process", "message": "Core must not read process state." }
          ],
          "patterns": [
            {
              "group": ["node:*"],
              "message": "Core must not import Node host APIs. Use ports and adapters."
            }
          ]
        }
      ]
    }
  }
);
