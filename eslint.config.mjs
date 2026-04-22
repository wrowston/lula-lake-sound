import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportSpecifier[imported.name='useEffect']",
          message:
            "Do not use useEffect — see AGENTS.md §2. Prefer ref callbacks, useSyncExternalStore, derived state, or event handlers.",
        },
        {
          selector:
            "MemberExpression[object.name='React'][property.name='useEffect']",
          message: "Do not use React.useEffect — see AGENTS.md §2.",
        },
      ],
    },
  },
];

export default eslintConfig;
