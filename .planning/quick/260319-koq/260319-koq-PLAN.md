---
phase: quick
plan: "260319-koq"
type: execute
wave: 1
depends_on: []
files_modified:
  - tenant-web/package.json
autonomous: true
requirements: []
---

<objective>
验证 tenant-web 构建打包正常（pnpm build 成功）
</objective>

<context>
@tenant-web/package.json
@tenant-web/next.config.mjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: 执行 tenant-web 构建</name>
  <files>tenant-web/package.json</files>
  <action>
    在 tenant-web 目录执行 pnpm build，运行 Next.js 生产构建。

    构建命令：cd tenant-web && pnpm build

    验证构建输出 .next 目录包含 standalone 输出。
  </action>
  <verify>
    <automated>cd tenant-web && pnpm build 2>&1 | tail -20</automated>
  </verify>
  <done>pnpm build 成功完成，输出包含 "Build completed" 或类似成功信息，无 Error 级别错误</done>
</task>

</tasks>

<success_criteria>
- pnpm build 在 tenant-web 目录成功执行
- 构建产物生成在 .next 目录
- 无 TypeScript 错误导致构建失败
</success_criteria>

<output>
After completion, create `.planning/quick/260319-koq/260319-koq-SUMMARY.md`
</output>
