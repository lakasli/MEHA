# Checklist

## 项目脚手架
- [x] Vite + React 18 + TypeScript 项目可通过 `npm install && npm run dev` 启动
- [x] Google Fonts（Playfair Display, Inter, JetBrains Mono）正确加载
- [x] CSS custom properties 设计令牌完整迁移至 `tokens.css`
- [x] `npm run build` 无错误，生成生产构建产物

## 组件架构
- [x] 所有组件位于 `src/components/` 下，按 layout / runner / monitor / results / common 分组
- [x] 每个组件有对应的 CSS 文件，使用 BEM 风格类名
- [x] 组件通过 props 接收数据，不依赖全局变量
- [x] 无 props drilling 问题（跨层级状态通过 Context 传递）

## Mock 数据层
- [x] MSW handlers 覆盖所有 API 端点（实验列表、AGV 状态、MQTT 消息、实验结果、运行控制）
- [x] 开发模式下 MSW browser worker 在 `main.tsx` 中启动
- [x] Mock 数据与原 HTML 内嵌数据一致（7 个实验、10 辆 AGV、15+ 条 MQTT 消息）
- [x] MQTT 消息流以 800-1500ms 间隔持续推送

## 面板功能
- [x] Runner 面板：7 个实验可切换，参数和预期结论动态更新
- [x] Runner 面板：Run 按钮启动模拟进度（阶段文字 + 百分比），Stop 暂停，Reset 清零
- [x] Monitor 面板：MQTT 消息流自动滚动，方向着色（out=amber, in=blue）
- [x] Monitor 面板：10 辆 AGV 卡片显示状态、任务、位置、速度、电量条
- [x] Results 面板：4 个子标签切换正常
- [x] Results 面板：E1 数据表格（5 方法 × 6 指标），MEHA 行最优值着色
- [x] Results 面板：E2 分组柱状图（5 方法 × 5 分布），Canvas 渲染正确
- [x] Results 面板：E4 堆叠柱状图（3 消融组件 × 6 分布）
- [x] Results 面板：E6 门控热力图（6×6 网格），hover 显示 tooltip

## 状态管理
- [x] ExperimentContext 提供 activePanel / activeExp / isRunning 全局状态
- [x] 侧边栏点击切换面板，视图和导航高亮同步更新
- [x] 键盘快捷键 1/2/3 切换面板，Ctrl+R 运行实验

## 视觉一致性
- [x] 背景色 `#141311`，主文字 `#F3F0EC`，强调色 `#C2894A`
- [x] Playfair Display 用于标题，Inter 用于正文/UI，JetBrains Mono 用于数据/代码
- [x] 卡片、边框、圆角、间距与原 HTML 一致
- [x] 架构条（ArchStrip）显示完整 MEHA → MQTT → SimAGV3.0 链路

## 测试
- [x] `npx vitest run` 全部测试通过
- [x] ExperimentSelector 测试：7 选项渲染 + 点击切换
- [x] MqttStream 测试：消息渲染 + 方向着色
- [x] AgvCard 测试：状态标签 + 电量条
- [x] DataTable 测试：行列 + 着色
- [x] Heatmap 测试：单元格数 + hover tooltip
- [x] RunControls 测试：Run/Stop/Reset 行为

## 响应式与无障碍
- [x] 860px 断点下侧边栏折叠为顶部横条
- [x] `prefers-reduced-motion` 禁用所有动画
- [x] 按钮有 `:focus-visible` outline
- [x] 无控制台错误
