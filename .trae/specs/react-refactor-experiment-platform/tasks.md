# Tasks

## Phase 1: 项目脚手架与设计令牌

- [ ] **Task 1: 初始化 Vite + React + TypeScript 项目**
  - 使用 `npm create vite@latest meha-experiment-platform -- --template react-ts` 创建项目
  - 安装依赖：`react-router-dom`
  - 安装测试依赖：`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `msw`
  - 配置 `vitest.config.ts`（jsdom 环境、setup 文件、CSS modules 支持）
  - 配置 `vite.config.ts`（路径别名 `@/` → `src/`）
  - 创建 `.gitignore`（node_modules, dist, .env）
  - 清理 Vite 默认模板文件

- [ ] **Task 2: 创建设计令牌体系 `src/styles/`**
  - 创建 `src/styles/tokens.css`：从原 HTML `:root` 迁移全部 CSS custom properties（颜色6组、字体3组、间距、圆角、过渡）
  - 创建 `src/styles/global.css`：reset、body 基础样式、滚动条、reduced-motion、响应式断点
  - 在 `main.tsx` 中按顺序引入 `tokens.css` → `global.css`
  - 配置 `index.html`：Google Fonts 预连接（Playfair Display + Inter + JetBrains Mono）

## Phase 2: 类型定义与 Mock 数据

- [ ] **Task 3: 定义 TypeScript 类型 `src/types/`**
  - `experiment.ts`：Experiment, ExperimentKey, ParamItem, RunStatus 类型
  - `agv.ts`：AgvStatus, AgvFleet 类型
  - `mqtt.ts`：MqttMessage, MqttDirection 类型
  - `results.ts`：E1Result, DegradationData, AblationData, GatingWeight 类型

- [ ] **Task 4: 创建 Mock 数据层 `src/mocks/`**
  - `src/mocks/data/experiments.ts`：7 个实验的完整配置数据（从原 HTML `experiments` 对象迁移）
  - `src/mocks/data/agvFleet.ts`：10 辆 AGV 的模拟状态数据
  - `src/mocks/data/mqttMessages.ts`：MQTT 消息池（15+ 条预设消息）
  - `src/mocks/data/results.ts`：E1 表格数据、E2 退化率数据、E4 消融数据、E6 门控权重矩阵
  - `src/mocks/handlers.ts`：MSW handlers（REST endpoints: GET /api/experiments, GET /api/agv-fleet, GET /api/results/:expId, POST /api/experiments/:expId/run）
  - `src/mocks/server.ts`：MSW server setup（for tests）
  - `src/mocks/browser.ts`：MSW browser setup（for dev）

## Phase 3: 通用组件

- [ ] **Task 5: 实现通用 UI 组件 `src/components/common/`**
  - `Card.tsx` + `Card.css`：卡片容器（header + body 插槽）
  - `Button.tsx` + `Button.css`：按钮（primary / secondary / danger 变体，loading 状态）
  - `StatusDot.tsx` + `StatusDot.css`：连接状态指示点
  - `SectionHead.tsx` + `SectionHead.css`：分区标题组件
  - `ProgressBar.tsx` + `ProgressBar.css`：进度条（animated fill, label）
  - `Badge.tsx` + `Badge.css`：状态标签（done / running / idle / error）

## Phase 4: 布局组件

- [ ] **Task 6: 实现布局组件 `src/components/layout/`**
  - `Sidebar.tsx` + `Sidebar.css`：左侧导航栏（品牌区、视图切换、实验列表、底部状态）
  - `TopBar.tsx` + `TopBar.css`：顶部信息栏（标题、Broker 地址、AGV 数量、Uptime）
  - `ArchStrip.tsx` + `ArchStrip.css`：架构示意条（MEHA → MQTT → VDA5050 → SimAGV3.0）
  - `AppLayout.tsx`：组装 Sidebar + TopBar + ArchStrip + 内容区

## Phase 5: 业务面板组件

- [ ] **Task 7: 实现 Runner 面板 `src/components/runner/`**
  - `ExperimentSelector.tsx` + CSS：实验列表（7项），选中高亮，状态标签，点击切换
  - `ConfigPanel.tsx` + CSS：参数网格，分布标签，动态随选中实验更新
  - `ExpectedOutcome.tsx` + CSS：核心问题 + 预期结论展示
  - `RunControls.tsx` + CSS：Run/Stop/Reset 按钮 + 进度条 + 阶段文字
  - `ExperimentRunner.tsx`：组装以上子组件，管理运行状态

- [ ] **Task 8: 实现 Monitor 面板 `src/components/monitor/`**
  - `MqttStream.tsx` + CSS：终端式消息流（自动滚动、新消息动画、方向着色、速率显示）
  - `AgvCard.tsx` + CSS：单辆 AGV 卡片（ID、状态标签、任务/位置/速度、电量条）
  - `FleetSummary.tsx` + CSS：四格汇总（Active Tasks / Collisions / Avg Battery / Makespan）
  - `LiveMonitor.tsx`：组装以上子组件，管理 MQTT 模拟定时器

- [ ] **Task 9: 实现 Results 面板 `src/components/results/`**
  - `ResultsTabs.tsx` + CSS：E1/E2/E4/E6 标签切换
  - `DataTable.tsx` + CSS：E1 同分布对比表格（方法名加粗、最优值着色）
  - `BarChart.tsx` + CSS：Canvas-based 分组柱状图（E2 退化率）+ 堆叠柱状图（E4 消融），支持 resize 重绘
  - `Heatmap.tsx` + CSS：E6 门控权重热力图（CSS Grid，hover tooltip，行列标签）
  - `ResultsPanel.tsx`：组装以上子组件，管理标签切换

## Phase 6: 状态管理与 Hooks

- [ ] **Task 10: 实现共享状态与 Hooks**
  - `src/contexts/ExperimentContext.tsx`：全局 Context（activePanel, activeExp, isRunning, runProgress）
  - `src/hooks/useExperimentRun.ts`：管理实验运行状态机（idle → running → completed/stopped），通过 MSW mock API 模拟进度
  - `src/hooks/useMqttStream.ts`：管理 MQTT 消息流（定时推送、速率统计、消息队列）
  - `src/hooks/useAgvFleet.ts`：获取 AGV 舰队状态（从 mock API 加载）
  - `src/hooks/useExperimentResults.ts`：获取实验结果（按 expId 从 mock API 加载）

## Phase 7: 应用组装与路由

- [ ] **Task 11: 组装 App 入口**
  - `App.tsx`：使用 AppLayout 包裹，根据 activePanel 切换 Runner / Monitor / Results
  - `main.tsx`：ReactDOM 渲染 + MSW browser worker 启动
  - 键盘快捷键：`1/2/3` 切换面板，`Ctrl+R` 运行实验

## Phase 8: 测试

- [ ] **Task 12: 编写组件测试 `src/__tests__/`**
  - `ExperimentSelector.test.tsx`：渲染 7 选项、点击切换、高亮状态
  - `MqttStream.test.tsx`：消息渲染、方向着色、新消息插入
  - `AgvCard.test.tsx`：状态标签、电量条宽度、hover 效果
  - `DataTable.test.tsx`：表格行列、最优值着色
  - `Heatmap.test.tsx`：网格单元格数、hover tooltip 内容
  - `RunControls.test.tsx`：点击 Run 触发进度、Stop 暂停、Reset 清零

## Phase 9: 验证与打磨

- [ ] **Task 13: 端到端验证**
  - 在开发环境手动验证所有面板切换和交互
  - 对比原 HTML 版本确保视觉一致性（颜色、字体、间距、动画）
  - 运行 `npx vitest run` 确保全部测试通过
  - 运行 `npm run build` 确保生产构建成功

# Task Dependencies
- Task 2, 3 依赖 Task 1
- Task 4 依赖 Task 3
- Task 5 依赖 Task 2
- Task 6 依赖 Task 2, 5
- Task 7, 8, 9 依赖 Task 4, 5, 6（可并行）
- Task 10 依赖 Task 4, 7, 8, 9
- Task 11 依赖 Task 10
- Task 12 依赖 Task 7, 8, 9
- Task 13 依赖 Task 12
