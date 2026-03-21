---
phase: quick
plan: "260321-py9"
subsystem: tenant-web
tags: [utilities, form, ui]
dependency_graph:
  requires: []
  provides: []
  affects:
    - tenant-web/src/app/utilities/page.tsx
    - tenant-web/src/app/utilities/components/CreateUtilityDialog.tsx
tech_stack:
  added:
    - RadioGroup (shadcn/ui @radix-ui/react-radio-group)
    - AlertDialog (shadcn/ui @radix-ui/react-alert-dialog)
    - useQuery for existing reading check
  patterns:
    - Cascading Select with combined value (year-month, apartment-room)
    - Confirmation dialog before data overwrite
key_files:
  created: []
  modified:
    - tenant-web/src/app/utilities/components/CreateUtilityDialog.tsx
    - tenant-web/src/app/utilities/page.tsx
decisions:
  - "RadioGroup 替代 Select 实现录入场景选择，直观展示三个互斥选项"
  - "年月合并为一个 Select，一次选择完成，减少操作步骤"
  - "公寓+房间合并为一个 Select，通过 apartmentRooms 预计算结构提供级联选项"
  - "重复账期检测通过 useQuery 实现，提交时检查并弹出确认框"
metrics:
  duration: "<1 minute"
  completed: "2026-03-21"
---

# Phase quick Plan 260321-py9: 水电读数表单校验提示、确认覆盖、级联选择改造

**One-liner:** 水电录入表单 UI 改造：RadioGroup 场景选择、年月/公寓房间级联选择、重复读数确认覆盖

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace reading_context Select with RadioGroup | 9ec0c50 | CreateUtilityDialog.tsx |
| 2 | Combine year/month into single cascading Select | 9ec0c50 | CreateUtilityDialog.tsx |
| 3 | Combine apartment/room into single cascading Select | 9ec0c50 | CreateUtilityDialog.tsx, page.tsx |
| 4 | Add overwrite confirmation dialog | 9ec0c50 | CreateUtilityDialog.tsx |

## What Was Built

**Task 1 - RadioGroup 替代 Select:**
- `reading_context` 字段从下拉 Select 改为 `RadioGroup` 组件
- 三个选项横向排列：正常抄表 / 首次录入 / 更换新表
- 每个选项使用 `RadioGroupItem` + Label，点击 Label 也可选中

**Task 2 - 年月级联选择:**
- 原来的「年份」和「月份」两个 Select 合并为一个
- Select value 格式为 `2026-3`，显示为 `2026年3月`
- `onValueChange` 解析 value 并同时设置 `period_year` 和 `period_month`
- 提供前后各1年共36个月的选项

**Task 3 - 公寓房间级联选择:**
- 原来的「公寓」和「房间」两个 Select 合并为一个
- `page.tsx` 新增 `apartmentRooms` useMemo 预计算结构
- Select 显示格式为 `公寓A - 101室`，value 直接存储 `room_id`
- 只显示有活跃租约的已入住房间
- 移除了未使用的 `createApartmentId` 状态和相关 rooms 查询

**Task 4 - 重复读数确认覆盖:**
- 新增 `useQuery` 监听 room_id / period_year / period_month 变化，查询同名下已有读数
- `handleSubmit` 时若发现重复读数，设置 `existingReading` 状态并返回（不提交）
- 弹出 `AlertDialog` 显示已有读数信息（公寓-房间+年月），提供「取消」和「确认覆盖」两个操作
- 确认后调用 `onSubmit` 完成覆盖

## Deviations from Plan

无偏差 - 所有任务按计划执行完毕。

## Verification

- TypeScript 类型检查通过（`tsc --noEmit`）
- `RadioGroup` 在文件中出现 22 次（含导入和使用）
- `账期（年月）` 标签存在
- `公寓 - 房间` 标签存在
- `AlertDialog` 相关组件出现 6 次

## Commits

- **9ec0c50** feat(quick-260321-py9): 改造水电读数录入表单

## Self-Check

- [x] CreateUtilityDialog.tsx 存在且内容完整
- [x] page.tsx 存在且内容完整
- [x] commit 9ec0c50 存在
- [x] SUMMARY.md 已创建
