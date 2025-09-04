import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 继承 next 官方规则
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 自定义覆盖规则
  {
    rules: {
      // 把 any 从 error 降级为 warn（不会阻止 build）
      "@typescript-eslint/no-explicit-any": "warn",

      // 允许使用 @ts-ignore
      "@typescript-eslint/ban-ts-comment": "off",

      // 未使用变量只给警告，而不是报错
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // 忽略目录/文件
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
