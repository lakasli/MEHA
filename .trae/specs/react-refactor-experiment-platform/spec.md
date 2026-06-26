# React Refactor — MEHA Experiment Platform Spec

## Why
当前实验平台为单文件 HTML（~1800行），CSS/JS/HTML 混杂，难以维护、测试和扩展。需重构为 React 工程化项目，建立清晰的文件目录结构，并通过 mock 数据层实现可测试的交互流程。

## What Changes
- 将单文件 HTML 拆分为 React 组件树（TypeScript + Vite）
- 建立模块化目录结构：layout / runner / monitor / results / common 组件分组
- 引入 MSW (Mock Service Worker) 作为 mock 层，模拟 MQTT 消息流、AGV 状态、实验结果 API
- 保留现有 Anthropic-inspired 设计令牌体系（CSS custom properties）
- 保持三面板交互（Runner / Monitor / Results）及全部现有功能
- 添加 Vitest + React Testing Library 组件测试
- **BREAKING**: 文件从单个 HTML 变为完整 React 工程

## Impact
- Affected specs: 无（新 spec）
- Affected code: `experiment-platform.html`（保留作为参考，新建 `meha-experiment-platform/` 目录）

## ADDED Requirements

### Requirement: React Project Scaffold
系统 SHALL 使用 Vite + React 18 + TypeScript 搭建项目脚手架，包含 CSS custom properties 设计令牌体系。

#### Scenario: Project initialization
- **WHEN** 开发者执行 `npm install && npm run dev`
- **THEN** 开发服务器在 localhost 启动，显示完整实验平台界面

### Requirement: Component Architecture
系统 SHALL 将界面拆分为可复用的 React 组件，按功能域分组为 layout / runner / monitor / results / common。

#### Scenario: Component isolation
- **WHEN** 任一组件被独立渲染
- **THEN** 该组件正确显示其 UI，不依赖父组件状态传递以外的全局变量

### Requirement: Mock Data Layer
系统 SHALL 通过 MSW 提供完整的 mock API，模拟 MQTT 消息流、AGV 舰队状态、实验配置、实验结果等后端数据。

#### Scenario: Mock MQTT stream
- **WHEN** 用户打开 Live Monitor 面板
- **THEN** MQTT 消息流以 800-1500ms 间隔持续推送模拟消息，消息包含方向标识、topic 路径、JSON 载荷

#### Scenario: Mock experiment run
- **WHEN** 用户点击 Run Experiment
- **THEN** 进度条模拟 8-15 秒的完整实验流程（MQTT 连接 → 订单下发 → 状态采集 → 指标计算）

### Requirement: Component Testing
系统 SHALL 为关键交互组件提供单元测试，使用 Vitest + React Testing Library，覆盖渲染、用户交互、状态变更。

#### Scenario: Test experiment selector
- **WHEN** 运行 ExperimentSelector 测试
- **THEN** 验证 7 个实验选项正确渲染、点击切换高亮、参数面板同步更新

#### Scenario: Test heatmap tooltip
- **WHEN** 运行 Heatmap 测试
- **THEN** 验证网格正确渲染、hover 显示权重值 tooltip

### Requirement: State Management
系统 SHALL 使用 React Context 管理跨组件共享状态（当前选中实验、运行状态、面板切换），避免 props drilling。

#### Scenario: Panel switching
- **WHEN** 用户点击侧边栏 Live Monitor
- **THEN** Runner 面板隐藏，Monitor 面板显示，MQTT 流开始推送

### Requirement: Design Token Preservation
系统 SHALL 将所有 CSS 设计令牌（颜色、字体、间距、圆角）迁移至 `tokens.css`，保持现有 Anthropic-inspired 暖黑风格不变。

#### Scenario: Design consistency
- **WHEN** 对比 React 版本与原 HTML 版本
- **THEN** 视觉呈现完全一致（颜色、字体、间距、动画）
