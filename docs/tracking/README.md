# 执行追踪文档

本目录用于追踪当前尚未完成、但已经进入明确排期的并行任务流。

## 当前并行流

- [共享层收敛流](./shared-layer-stream.md)
  覆盖 Issue `#35`、`#36`，当前状态为已完成。
- [后端分层试点流](./api-boundary-stream.md)
  覆盖 Issue `#37`，负责 service / repository 边界试点重构。
- [租客触达能力流](./tenant-reachability-stream.md)
  覆盖 Issue `#28`，负责租客端正式消息触达第一期。

## 使用方式

- `PROGRESS.md` 负责给出全局顺序与当前建议。
- 本目录下的文档负责跟踪每条并行流的范围、阻塞项、下一步动作和完成标准。
- 如果某条流的范围发生变化，优先更新对应追踪文档，再更新 `PROGRESS.md`。
