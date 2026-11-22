// ESLint voor Open E-lab (flat config, ESLint 9). De regels komen van eslint-config-next:
// React, hooks, toegankelijkheid en de Next.js-valkuilen. Draait lokaal met `npm run lint`
// en in CI (.github/workflows/ci.yml).
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Onze afbeeldingen zijn QR-codes en uploads als data-URL; next/image brengt daar niets.
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      ".claude/**",
      "playwright-report/**",
      "test-results/**",
      // Gegenereerd door Next.js; niet van ons.
      "next-env.d.ts",
    ],
  },
];

export default config;
