import js from "@eslint/js";
import globals from "globals";

import next from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import security from "eslint-plugin-security";

import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "coverage/**",
    ],
  },

  // Base JS recommended (inclut no-undef etc.)
  js.configs.recommended,

  // Config commune JS/TS
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser, // document, window, HTMLDivElement, etc.
        ...globals.node, // process, Buffer, etc.
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      "@next/next": next,
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      security,
      "@typescript-eslint": tseslint,
    },
    rules: {
      // ✅ Next core web vitals
      ...next.configs["core-web-vitals"].rules,

      // ✅ Hooks
      ...reactHooks.configs.recommended.rules,

      // ✅ sécurité (règles existantes)
      "security/detect-object-injection": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",

      // ✅ logs
      "no-console": ["error", { allow: ["warn", "error"] }],

      // ✅ IMPORTANT : évite le doublon JS vs TS
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ✅ IMPORTANT : TS gère déjà ça, sinon spam
      "no-undef": "off",
    },
  },
  // ✅ 1) FRONT: désactiver object-injection (trop de faux positifs)
  {
    files: [
      "components/**/*.{js,jsx,ts,tsx}",
      "app/**/*.{js,jsx,ts,tsx}",
      "lib/store/**/*.{ts,tsx}",
      "lib/utils.{ts,tsx}",
      "lib/config/**/*.{js,ts}",
    ],
    rules: {
      "security/detect-object-injection": "off",
    },
  },

  // ✅ 2) SERVER: garder strict sur zones sensibles
  {
    files: [
      "app/api/**/*.{js,ts}",
      "middleware.{js,ts}",
      "utils/**/*server*.{js,ts}",
      "lib/server/**/*.{js,ts}",
    ],
    rules: {
      "security/detect-object-injection": "error",
    },
  },
  // ✅ Autoriser console.* uniquement dans le logger
  {
    files: ["lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
