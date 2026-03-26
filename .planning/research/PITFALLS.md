# Pitfalls Research

**Domain:** Property Management SaaS Application Optimization
**Researched:** 2026-03-26
**Confidence:** LOW

## Critical Pitfalls

### Pitfall 1: UI Split Without Data Dependency Analysis

**What goes wrong:**
页面被拆分成多个组件或路由后，用户操作流程断裂——比如在一个页面填写的表单数据，跳转后消失；或者列表页和详情页之间的状态不同步。用户体验反而比拆分前更差。

**Why it happens:**
开发者在拆分页面时，只关注视觉布局，没有分析组件之间的数据流和状态共享需求。React/Vue 的组件化思维与业务流程思维不匹配。

**How to avoid:**
1. 拆分前先用用户流程图（User Flow）梳理所有操作路径
2. 对于跨页面状态，使用 URL 参数、Context、状态管理库或后端 session 存储
3. 每个拆分后的页面单元，要能独立完成一个最小业务闭环
4. 建立"跳转协议"——列表→详情、编辑→列表、创建→列表的返回逻辑必须明确

**Warning signs:**
- 拆分后出现大量 prop drilling
- 频繁需要"从 URL 重新拉取数据"来同步状态
- 用户反馈"填了一半找不到了"

**Phase to address:**
拆分优化阶段（Phase 2-3）必须有数据流分析和用户路径验证环节，不能只做 UI 拆分。

---

### Pitfall 2: Mock Data 替换后 API 契约不匹配

**What goes wrong:**
Mock 数据替换为真实数据库查询后，前端开始出现类型错误、字段缺失、格式化逻辑失效。页面出现 null/undefined 渲染空白，或者日期/金额显示格式与 mock 时期完全不同步。

**Why it happens:**
Mock 数据往往是手工构造的理想数据，字段结构与后端实际 schema 不一致。开发者没有在替换时做完整的契约校验（API contract validation）。

**How to avoid:**
1. 在替换前，先用 API contract schema 做 mock 数据的校验
2. 替换时采用"接口先行"策略：先确保 API schema 与前端期望完全对齐，再切换数据源
3. 为每个 API 响应建立类型定义（TypeScript interfaces/Zod schemas），用 schema validation 做运行时校验
4. 保留 mock 数据的测试用例作为 snapshot，切换后对比差异

**Warning signs:**
- 前端出现大量 `as` 类型断言
- API 响应中有 `null` 但前端没有做空值处理
- 日期格式（ISO 8601 vs YYYY-MM-DD）在不同模块不一致

**Phase to address:**
数据层替换阶段（Phase 4），每个 API 接口必须有 schema 校验和空值处理。

---

### Pitfall 3: 样式统一变成样式冻结

**What goes wrong:**
为统一风格而重构 CSS，结果发现新样式在某些模块不适用，却因为"统一性"要求被强行覆盖，导致功能 bug——比如下拉菜单被截断、弹窗超出视窗、移动端布局错乱。

**Why it happens:**
设计系统在追赶开发进度，统一时只做了视觉层面的覆盖，没有考虑各模块的业务场景差异。强制统一后，特殊 case 被破坏。

**How to avoid:**
1. 样式统一前，先建立组件行为规范（Component Spec），不只是颜色字体
2. 使用 CSS Custom Properties / Design Tokens，允许业务模块局部覆盖
3. 对"不统一样式"做记录：为什么这个模块需要例外？例外是否合理？
4. 样式重构后，对每个模块做功能回归测试，不能只检查视觉

**Warning signs:**
- 样式重构后出现 `overflow: hidden` 截断内容
- 某些模块需要 `!important` 才能覆盖样式
- 移动端出现横向滚动条

**Phase to address:**
样式统一（Phase 5）必须与组件行为规范同步，必须保留必要的情景覆盖能力。

---

### Pitfall 4: 渐进增强变成渐进破坏

**What goes wrong:**
计划对系统做渐进式优化，结果每次改动都引入新的 bug，越改越差。用户和测试人员疲于奔命，系统稳定性反而下降。

**Why it happens:**
缺乏改动影响范围分析，每次"小改动"都是独立测试，没有做端到端回归验证。渐进式变成了"打补丁"。

**How to avoid:**
1. 每次改动前，强制填写"改动影响分析"：哪些模块、哪些用户流程受影响？
2. 建立最小回归套件（smoke test），每次改动后必须通过
3. 遵守"功能门禁"原则：一个完整业务闭环改完之前，不合入主分支
4. 定期做全量回归，防止 bug 累积

**Warning signs:**
- 每次合并后出现新的 bug report
- 开发者说"这只是个小改动"但实际影响了多个模块
- 测试覆盖率下降

**Phase to address:**
所有阶段都需要回归测试门禁，渐进增强必须有纪律约束。

---

### Pitfall 5: 页面拆分后缺少导航上下文

**What goes wrong:**
一个大页面拆成多个子页面后，用户失去操作上下文——不知道自己在哪个步骤、之前的操作是否保存、上一步返回会到哪。

**Why it happens:**
拆分时只考虑信息密度，没有设计导航架构（Navigation Architecture）。面包屑、步骤指示器、返回逻辑被忽略。

**How to avoid:**
1. 每个子页面必须有明确的"我在哪"指示（面包屑、页面标题、步骤编号）
2. 建立"操作状态持久化"机制：用户在子页面填写的内容，切换后不能丢失
3. 返回逻辑必须明确：取消操作是返回上一步还是直接退出？退出是否需要确认？
4. 设计"草稿自动保存"机制，防止用户意外关闭页面

**Warning signs:**
- 用户反馈"我不知道怎么回去"
- 页面刷新后，之前填写的内容全部消失
- 用户在填写一半时误点导航，导致数据丢失

**Phase to address:**
页面拆分阶段必须同步设计导航架构，不能只拆分不设计导航。

---

### Pitfall 6: 过度抽象导致可维护性下降

**What goes wrong:**
为统一风格创建大量抽象组件，结果发现抽象组件的 props 爆炸，特殊情况处理比直接写还复杂。后续开发者不敢改也不敢删。

**Why it happens:**
过早优化（Premature Optimization）——在还没完全理解各模块差异时，就急于统一抽象。结果抽象层成了一个难以修改的脆弱层。

**How to avoid:**
1. 先让各模块独立运行，确认功能正确后，再识别真正的共性
2. 抽象层次要分层：基础组件（Button/Input）→ 业务组件（PropertyCard）→ 页面布局（PropertyDetailPage）
3. 遵守"三次规则"：一个模式出现三次之后，再考虑抽象
4. 抽象组件必须有文档和使用示例

**Warning signs:**
- 组件 props 超过 15 个
- 组件内部有大量条件渲染（`{condition && <Component />}`）
- 需要阅读组件源码才能知道如何使用

**Phase to address:**
抽象重构阶段（Phase 6），抽象必须以实际重复为基础，不能基于预测。

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 用 `any` 类型跳过类型检查 | 快速绕过编译错误 | 类型安全崩塌，运行时 bug 增加 | 临时兼容老代码，必须有 TODO |
| 复制粘贴相似组件而不是抽象 | 快速交付，避免抽象风险 | 代码重复，维护成本倍增 | 最多复制一次，再出现必须抽象 |
| 用 CSS 全局覆盖而非模块化 | 快速修复样式问题 | 样式冲突累积，后续改动困难 | 仅用于 hotfix，之后必须重构 |
| Mock 数据不删，注释掉 | 保留参考，切换方便 | 代码膨胀，误导后续开发者 | 仅在明确标注的前提下短暂保留 |
| 不写测试，直接上线 | 开发速度快 | 回归风险高，修改成本高 | 永远不可接受 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| 数据库查询 | N+1 查询问题，一次性加载所有关联数据 | 按需加载，使用 DataLoader 做批量查询 |
| 状态管理 | 全局状态存储过多业务数据 | 状态本地化，父组件管理，Context 仅传必需 |
| 外部 API | 没有超时和重试机制 | 添加合理的超时（3-5s）、指数退避重试 |
| 文件上传 | 前端直接传大文件没有分片 | 文件分片上传，断点续传，服务器端合并 |
| 缓存策略 | 缓存数据不设过期时间 | 根据业务场景设置合理 TTL，用户操作后主动失效 |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 列表页面一次性渲染所有数据 | 页面卡顿，滚动掉帧 | 分页 / 虚拟滚动（Virtual Scrolling） | 超过 100 条数据时 |
| 大量 useEffect 触发重复请求 | Network tab 大量重复请求 | 请求去重（debounce / deduplicate） | 组件频繁挂载时 |
| 状态更新触发全组件重渲染 | 轻微操作就卡顿 | React.memo / useMemo / useCallback | 状态管理库中数据频繁变化时 |
| 大图未压缩直接展示 | 首屏加载超过 3 秒 | 图片压缩、CDN、懒加载 | 图片超过 500KB 时 |
| 不做查询优化（N+1） | 数据库 CPU 飙升 | 预加载（eager loading）、索引优化 | 关联查询超过 3 层时 |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| 租户数据未做行级隔离检查 | 用户可能访问其他租户数据 | 每个查询必须带 tenant_id 条件，后端二次验证 |
| 敏感字段（密码/支付信息）未脱敏展示 | 敏感信息泄露 | 后端返回脱敏数据，前端不做解密 |
| API 缺少权限校验 | 普通用户可以操作管理员功能 | 每个接口必须有角色校验中间件 |
| 导入功能未校验文件类型和大小 | 文件上传攻击 | 白名单文件类型，大小限制，病毒扫描 |
| SQL 直接拼接（即使用 ORM） | 注入攻击 | 参数化查询，ORM 的原始查询也要校验 |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 必填字段没有明显标记 | 用户提交失败，不知道哪里填错 | 必填字段用 * 标记，提交时聚焦第一个错误 |
| 表单提交后无反馈 | 用户反复点击，不知道是否成功 | Loading 状态 + 成功后跳转或提示 |
| 错误提示不说明原因 | 用户不知道如何修复 | 错误提示要具体（如"手机号格式不正确"而非"输入有误"） |
| 列表页缺少搜索和过滤 | 数据量大时难以找到目标 | 至少支持关键词搜索，有筛选条件的必须提供筛选 |
| 移动端布局直接缩放 | 操作区域过小，无法点击 | 移动端必须单独布局，触控区域至少 44px |
| 操作后不更新列表 | 用户以为没成功，反复操作 | 操作成功后立即刷新列表或乐观更新 UI |
| 分页信息不清晰 | 用户不知道当前在哪一页 | 显示"第 X 页，共 Y 页，共 Z 条" |
| 权限不足时直接隐藏功能 | 用户困惑为什么有这个入口却不能用 | 权限不足时显示但置灰，并说明原因 |

## "Looks Done But Isn't" Checklist

- [ ] **Mock 数据替换:** 替换后所有字段都验证了吗？空值场景处理了吗？
- [ ] **页面拆分:** 跳转返回逻辑测试了吗？草稿数据保存了吗？
- [ ] **样式统一:** 各模块功能回归测试了吗？移动端验证了吗？
- [ ] **API 契约:** schema validation 集成了吗？类型错误在 CI 中捕获了吗？
- [ ] **状态管理:** 状态更新后 UI 同步了吗？并发操作冲突处理了吗？
- [ ] **错误处理:** 所有 API 错误都展示给用户了吗？网络错误处理了吗？
- [ ] **权限控制:** 每个操作都校验权限了吗？前端禁用后后端也校验了吗？
- [ ] **性能:** 大量数据时分页/虚拟滚动实现了吗？首屏加载时间验证了吗？

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| UI 拆分导致流程断裂 | HIGH | 回滚页面合并，重建数据流分析，逐个模块重新拆分验证 |
| Mock 数据替换引入 bug | MEDIUM | 添加 API 拦截器对比差异，修复 schema 不匹配，补充空值处理 |
| 样式统一破坏特殊 case | MEDIUM | 识别被破坏的模块，使用 CSS Custom Properties 允许例外 |
| 渐进增强引入回归 bug | LOW-MEDIUM | 触发 CI 回归测试，定位引入改动的 commit，逐个修复 |
| 页面拆分后导航丢失 | MEDIUM | 添加面包屑和步骤指示器，实现草稿自动保存机制 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| UI 拆分流程断裂 | Phase 2: 页面拆分规划 | 用户路径测试，所有操作路径能闭环 |
| Mock 数据契约不匹配 | Phase 3: 数据层规范化 | Schema validation 通过，类型错误为零 |
| 样式统一破坏功能 | Phase 4: 样式统一 | 全模块功能回归，移动端验证 |
| 渐进增强回归累积 | Phase 1: 工程基础设施 | 每次合并有 CI 门禁，覆盖率不下降 |
| 导航上下文丢失 | Phase 2: 页面拆分 | 面包屑存在性验证，草稿保存验证 |
| 过度抽象 | Phase 5: 抽象重构 | 组件 props 数量监控，重复代码扫描 |
| N+1 查询性能问题 | Phase 3: 数据层规范化 | 性能测试，查询计数验证 |
| 租户数据隔离 | 所有阶段 | 安全审计，隔离测试 |

## Sources

- 通用软件工程反模式（行业经验）
- React/Vue 组件化最佳实践
- Property Management Software 常见产品问题分析
- 企业级 SaaS 安全性要求（OWASP Top 10 + 租户隔离）

---

*Pitfalls research for: Property Management SaaS Optimization*
*Researched: 2026-03-26*
