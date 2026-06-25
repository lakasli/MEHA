# Paper Configuration Record — 面向工业仓储异构AGV集群的跨分布泛化集中式调度方法

> 生成日期：2026-06-25  
> 所属管线：academic-paper / Phase 0

---

## 1. 基本信息

| 配置项 | 内容 |
|--------|------|
| **论文类型** | 新方法/算法论文（Original Research / Method Paper） |
| **学科领域** | 人工智能 × 运筹学（AI for Combinatorial Optimization / Intelligent Scheduling） |
| **论文标题（拟）** | 面向工业仓储异构AGV集群的跨分布泛化集中式调度方法 |
| **英文标题（拟）** | Cross-Distribution Generalized Centralized Scheduling for Heterogeneous AGV Fleets in Industrial Warehouses |
| **目标会议/期刊** | 待定（建议：AAAI / IJCAI / IEEE T-ITS / NeurIPS，视实验完成度而定） |
| **引用格式** | IEEE |
| **输出格式** | LaTeX |
| **语言** | 中文撰写（主体），英文摘要 |
| **目标字数** | 8,000–12,000 字（会议论文体量） |

## 2. 核心研究要素

| 维度 | 选择 | 参考工作 |
|------|------|----------|
| **问题场景** | 工业仓储 Kiva 类网格仓库，异构 AGV 集群 | — |
| **问题建模** | 扩展 HCVRP，融入仓储特有约束（网格地图、双向通道、充电约束） | Li et al. (HCVRP) [9] |
| **基础架构** | Transformer 编码器-解码器（集中式控制） | Kool et al. (AM), POMO |
| **泛化机制** | 多专家模块 + 约束紧度感知门控 | Fu et al. NeurIPS 2025 [8] |
| **异构建模** | 多类型注意力机制，区分同类型/跨类型 AGV 交互 | Li et al. HCVRP [9] |
| **训练策略** | REINFORCE + 多分布采样训练 | 综述 §4.2 鲁棒训练方案 |
| **验证环境** | 标准简化网格仓库仿真 | — |

## 3. 关键技术组件

### 3.1 编码器
- Transformer Encoder with multi-head self-attention
- AGV 类型嵌入（Type Embedding）：不同 AGV 类型的可学习嵌入向量
- 约束紧度编码（Tightness Encoding）：将场景参数（AGV数量、任务密度、容量紧度）编码为条件信号

### 3.2 多专家门控模块
- 多个并行的 Expert 子网络，各自在特定分布上预训练/微调
- 门控网络（Gating Network）：根据约束紧度编码，输出各专家的激活权重
- 加权融合专家输出，送入解码器

### 3.3 解码器
- 集中式 Attention Decoder
- 逐步输出所有 AGV 的访问序列
- 使用 context embedding 同时建模全局状态和车辆特定状态

## 4. 论文结构

| 章节 | 内容概要 | 预估字数 |
|------|----------|----------|
| 1. 引言 | 问题背景、研究动机、核心贡献 | 1,200 |
| 2. 相关工作 | HCVRP进展、NCO泛化研究、多AGV调度 | 1,800 |
| 3. 问题建模 | 异构AGV调度问题的MDP形式化定义 | 1,200 |
| 4. 方法 | Multi-Expert Heterogeneous Attention Encoder-Decoder 框架详述 | 2,800 |
| 5. 实验 | 实验设置、基准对比、跨分布泛化消融实验 | 2,500 |
| 6. 讨论与展望 | 局限性分析、未来方向 | 800 |
| 7. 结论 | 总结贡献 | 500 |
| **合计** | | **约 10,800** |

## 5. 预期贡献

1. 提出首个面向仓储异构AGV集群的多专家泛化集中式调度框架
2. 设计约束紧度感知门控机制，实现跨场景分布的自适应专家路由
3. 设计异构注意力机制，区分同类型和跨类型AGV的协调关系
4. 在标准仓储仿真环境中验证跨规模、跨分布泛化能力的显著提升

## 6. 现有材料

- [x] 文献综述：`文献综述_AI+车辆调度文献综述：方法、应用与前沿_2026年06月25日21时31分48秒.md`

---

> **状态：待用户确认**  
> 确认后将进入 Phase 2：架构设计（详细大纲 + 论据映射）
