# 实验设计方案与代码文件结构

> 生成日期：2026-06-26  
> 所属管线：academic-paper / Phase 3 补充  
> 用途：指导实验代码实现与论文 §5 撰写  
> **仿真基座：SimAGV3.0** — 部署于远端系统的 VDA5050 多 AGV 仿真，本项目仅通过 MQTT 协议交互

---

## 第〇部分：SimAGV3.0 仿真基座概述

本文实验方案以已有的成熟仿真系统 **SimAGV3.0** 为基座。SimAGV3.0 **部署于远端系统**（独立进程/容器），本项目不包含 SimAGV3.0 源码，仅通过 **MQTT 协议（VDA5050 标准）** 与远端进行指令下发与状态采集。

### 0.1 通信架构

```
┌────────────────────────────────────────┐
│  本项目 (Python DRL 调度)               │
│                                        │
│  MQTT Publisher  ──→ VDA5050 Order    │
│  MQTT Subscriber  ←── VDA5050 State   │
│  MQTT Subscriber  ←── Visualization   │
│  MQTT Subscriber  ←── Connection      │
│                                        │
└──────────────┬─────────────────────────┘
               │  MQTT (TCP/IP)
               │  topic: uagv/{manufacturer}/{serial}/...
┌──────────────┴─────────────────────────┐
│  远端 SimAGV3.0 (独立部署, C++)        │
│                                        │
│  L2 SimInstanceCoordinator             │
│    ├── order topic → 订单接收/校验     │
│    ├── tickOnce()  → 运动/碰撞/电池    │
│    └── state topic → 状态发布          │
│  L3 Molecules: 任务执行、导航、安全    │
│  L4 Atoms: SAT碰撞、A*路由、电池模型   │
└────────────────────────────────────────┘
```

### 0.2 MQTT Topic 合约（本项目关注的 VDA5050 消息）

| 方向 | MQTT Topic | 载荷 | 含义 |
|------|-----------|------|------|
| 下发 ↑ | `.../order` | `VdaOrder` (nodes + edges + actions) | DRL 调度决策 → 远端 AGV |
| 下发 ↑ | `.../instantActions` | `VdaInstantActions` | 即时控制指令 |
| 采集 ↓ | `.../state` | `VdaStatePayload` (pose, battery, errors) | AGV 实时状态 |
| 采集 ↓ | `.../visualization` | 安全范围、轨迹 | 碰撞检测可视化 |
| 采集 ↓ | `.../connection` | 在线/离线/连接中断 | 连接状态 |

### 0.3 远端 SimAGV3.0 关键仿真能力（通过 MQTT 间接使用）

| 能力 | 远端内部实现 | 本项目感知方式 |
|------|-------------|---------------|
| 运动控制 | `simulateToPosition` 匀速到位 | state topic 中 AGV 位置变化 |
| 碰撞检测 | SAT 多边形碰撞 + AABB 安全重叠 | state/visualization 中的碰撞警告列表 |
| 路径规划 | A\* 拓扑路由 | 下发 order 中指定的 node 序列即路径 |
| 电池模型 | 线性消耗 (距离×负载×时间×速度) | state 中的 `batteryLevel` 变化 |
| 任务执行 | VDA5050 订单节点序列 + 举升动作 | order acceptance result + state 中的执行状态 |
| 安全监控 | 警告距离 → 临界距离 → 急停 | state 中的 `errors` 列表（含碰撞/急停事件） |

### 0.4 SimAGV3.0 与论文 DRL 调度层的关系

```
┌──────────────────────────────────────────────────────────┐
│  MEHA DRL 调度层 (Python, 本文贡献, 本项目代码)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ HeteAttn  │ │ Multi-   │ │ Decoder  │                 │
│  │ Encoder   │ │ Expert   │ │ + Mask   │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
│         │            │            │                       │
│         └────────────┼────────────┘                       │
│                      │ 调度决策 (任务→AGV 分配)           │
│         ┌────────────┴────────────┐                       │
│         │   MQTT Bridge           │                       │
│         │   order publish         │                       │
│         │   state subscribe       │                       │
│         └────────────┬────────────┘                       │
├──────────────────────┼───────────────────────────────────┤
│         ═════════════╪══════════════  MQTT 网络边界       │
├──────────────────────┼───────────────────────────────────┤
│  远端 SimAGV3.0 (独立部署, 不在本项目中)                   │
│                      ▼                                    │
│  VDA5050 Order → TaskExecution → Navigation → Motion     │
│                      │                                    │
│  Collision (SAT)     Safety Monitor     Battery           │
│                      │                                    │
│  State Publish ──→ MQTT ──→ 本项目采集                   │
└──────────────────────────────────────────────────────────┘
```

---

## 第一部分：实验设计总览

### 1. 实验矩阵

| 实验编号 | 实验名称 | 对应论文章节 | 核心问题 | 预期结论 |
|----------|---------|-------------|----------|----------|
| **E1** | 同分布基准对比 | §5.2.1 | MEHA基础求解质量如何？ | 与POMO持平（Gap ≤ ±0.5%） |
| **E2** | 跨分布泛化 | §5.2.2 | 多专家+门控是否降低跨分布退化率？ | 退化率显著低于AM/POMO |
| **E3** | 跨规模泛化 | §5.2.3 | 模型能否适应不同地图规模/AGV数量？ | 性能下降曲线更平缓 |
| **E4** | 消融实验 | §5.3.1 | 各模块(HeteAttn, Expert, TGate)独立贡献 | Expert > TGate > HeteAttn |
| **E5** | 数据增强对照 | §5.3.1 | 多专家是否优于单纯多分布采样训练？ | 多专家 > 数据增强单模型 |
| **E6** | 专家数量影响 | §5.3.2 | 最优专家数K是多少？ | K=4~6 |
| **E7** | 推理效率 | §5.3.3 | MEHA推理是否满足实时性？ | 毫秒级，满足仓储需求 |

### 2. 数据分布设计

#### 2.1 参数空间定义（基于 SimAGV3.0 实际能力）

```
SimAGV3.0 环境可变参数 (定义不同分布):
  ┌─────────────────────────────────────────────────────────┐
  │ 地图与拓扑                                               │
  │   map_id           ∈ {"Phase2_testmap", "beidaceshi",    │  实际地图文件
  │                       "floors-0311-1", "floors-0311-2"}  │  (topo.json + .pgm)
  │   num_stations     ∈ {8, 15, 25, 40}                    │  站点数量 (由地图决定)
  │   topology_density  = num_edges / num_stations           │  拓扑密度
  ├─────────────────────────────────────────────────────────┤
  │ AGV 配置 (per-instance config.yaml)                      │
  │   num_agvs          ∈ {5, 10, 15, 20, 30}               │  AGV 实例数
  │   vehicle_length    ∈ {0.8, 1.0, 1.5, 2.0} (m)          │  车体长度
  │   vehicle_width     ∈ {0.6, 0.8, 1.0, 1.2} (m)          │  车体宽度
  │   agv_type_profile  ∈ {uniform, heterogeneous}           │  类型分布模式
  │   max_speed         ∈ {0.5, 1.0, 1.5, 2.0} (m/s)        │  最大速度 (L4 constraint)
  ├─────────────────────────────────────────────────────────┤
  │ VDA5050 订单参数                                         │
  │   num_orders        ∈ {10, 20, 50, 100, 200}            │  订单数量
  │   nodes_per_order   ∈ {2, 4, 8, 16}                     │  每订单节点数
  │   order_arrival_rate ∈ {sparse, normal, burst}          │  订单到达模式
  │   action_types      ⊆ {LIFT_UP, LIFT_DOWN, LIFT_HOME}   │  节点动作类型
  ├─────────────────────────────────────────────────────────┤
  │ 安全约束参数 (SimAGV3.0 SafetyConfiguration)             │
  │   safety_factor     ∈ {1.1, 1.3, 1.5, 1.8, 2.0}        │  安全范围系数
  │   warning_distance  ∈ {0.5, 1.0, 1.5, 2.0} (m)         │  预警距离
  │   critical_distance ∈ {0.2, 0.5, 0.8, 1.0} (m)         │  临界距离
  │   enable_emergency_stop ∈ {true, false}                 │  启用急停
  ├─────────────────────────────────────────────────────────┤
  │ 电池与能耗参数 (L4 线性消耗模型)                          │
  │   battery_capacity  ∈ {50, 100, 200} (Ah)               │  额定容量
  │   consumption_rate  ∈ {0.01, 0.02, 0.05} (%/m·kg·s)   │  消耗系数
  │   low_battery_threshold ∈ {15, 20, 30} (%)              │  低电量阈值
  │   charge_rate       ∈ {0.5, 1.0, 2.0} (C)               │  充电倍率
  ├─────────────────────────────────────────────────────────┤
  │ 通信与时序参数                                            │
  │   publish_interval  ∈ {100, 200, 500, 1000} (ms)        │  状态发布间隔
  │   tick_interval     ∈ {50, 100, 200} (ms)               │  协调器 Tick 周期
  │   order_timeout     ∈ {5000, 10000, 30000} (ms)         │  订单超时
  └─────────────────────────────────────────────────────────┘

固定参数 (所有分布通用，直接取自 SimAGV3.0 实现):
  运动控制:       simulateToPosition (匀速到位, tolerance=0.05m)
  路径规划:       A* 拓扑路由 (aStarTopologyRouting)
  碰撞检测:       SAT 多边形碰撞 (checkPolygonCollision)
  安全重叠:       AABB 轴对齐矩形 (checkSafetyRangeOverlap)
  电池消耗:       线性模型 updateBatteryConsumption(dist, load, time, speed)
  订单协议:       VDA5050 (orderId + orderUpdateId + nodes/edges)
  举升动作:       executeLiftAction (LIFT_UP/DOWN, 50mm/s)
```

#### 2.2 具体分布配置

```
训练分布 D_train (对应 SimAGV3.0 中等规模场景):
  map_id="Phase2_testmap", num_agvs=10, uniform type profile,
  max_speed=1.0m/s, num_orders=50, nodes_per_order=4,
  safety_factor=1.3, warning_distance=1.0m, critical_distance=0.5m,
  battery_capacity=100Ah, consumption_rate=0.02, publish_interval=200ms

测试分布:
  D_test1 (同分布):        与 D_train 完全相同
  D_test2 (高订单密度):     num_orders=200, nodes_per_order=4
  D_test3 (低订单密度):     num_orders=10,  nodes_per_order=2
  D_test4 (异构AGV类型):    agv_type_profile=heterogeneous (混合车体尺寸)
  D_test5a (大地图):        map_id="beidaceshi-0819", num_agvs=20, num_orders=150
  D_test5b (更大规模):      map_id="floors-0311-2", num_agvs=30, num_orders=300
  D_test6a (少AGV):         num_agvs=5
  D_test6b (多AGV):         num_agvs=20
  D_test7a (宽松安全):      safety_factor=1.1, warning_distance=0.5m
  D_test7b (严格安全):      safety_factor=2.0, warning_distance=2.0m, enable_emergency_stop=true
  D_test8a (高电量):        battery_capacity=200Ah, low_battery_threshold=15%
  D_test8b (低电量压力):    battery_capacity=50Ah, consumption_rate=0.05, low_battery_threshold=30%
  D_test9a (低频通信):      publish_interval=1000ms, tick_interval=200ms
  D_test9b (高频实时):      publish_interval=100ms, tick_interval=50ms, order_timeout=5000ms
```

### 3. 基准方法

| 方法 | 类型 | 实现来源 | 配置说明 |
|------|------|----------|----------|
| **FCFS** | 传统启发式 | 本文实现 (MQTT下发) | 先到先服务，按订单到达顺序分配 |
| **Nearest-First** | 传统启发式 | 本文实现 (MQTT下发) | 贪心最近邻调度，基于 A\* 距离 |
| **AM** | DRL端到端 | [15] 官方复现 | 同分布训练，Transformer编码器-解码器 |
| **POMO** | DRL端到端 | [16] 官方复现 | 多起点采样，同分布训练 |
| **AM-MultiDist** | DRL+数据增强 | 本文复现 | AM架构 + 多分布采样训练（对照组） |
| **POMO-MultiDist** | DRL+数据增强 | 本文复现 | POMO架构 + 多分布采样训练（对照组） |
| **MEHA (Ours)** | DRL+多专家 | **本文** | 完整框架，以 SimAGV3.0 为仿真基座 |

> **关键对照设计**: FCFS 和 Nearest-First 为本文实现的非学习基准（通过 MQTT 下发订单至远端）。AM-MultiDist 和 POMO-MultiDist 是"数据增强对照组"，用于消除"提升仅来自多分布采样"的质疑（压力测试 §5.3）。

---

## 第二部分：代码文件结构（纯 Python，MQTT 桥接远端 SimAGV3.0）

```
meha-warehouse-scheduling/               # 本项目代码 (不含 SimAGV3.0 源码)
│
├── README.md                           # 项目说明、环境依赖、快速开始
├── requirements.txt                    # Python 依赖 (torch, numpy, paho-mqtt...)
├── setup.py                            # 包安装
│
├── simagv3_bridge/                     # MQTT 桥接层 (Python → 远端 SimAGV3.0)
│   ├── __init__.py
│   ├── mqtt_client.py                  # MQTT 客户端 (publish order, subscribe state)
│   ├── env_wrapper.py                  # Gym-style 环境封装 (指令下发 + 状态等待)
│   ├── order_builder.py                # VDA5050 订单构造 (nodes/edges/actions)
│   ├── state_parser.py                 # MQTT state JSON → observation 向量
│   ├── action_converter.py             # DRL action → VDA5050 order assignment
│   ├── batch_runner.py                # 多 AGV 并行 MQTT 会话管理器
│   └── remote_config.py               # 远端连接配置 (MQTT broker, manufacturer, serials)
│
├── src/                                # DRL 调度层 (本文贡献)
│   ├── __init__.py
│   │
│   ├── environment/                    # Gym 环境 (调用 simagv3_bridge)
│   │   ├── __init__.py
│   │   ├── warehouse_env.py            # 多AGV调度环境主类
│   │   ├── observation.py              # 观测空间定义 (AGV状态+订单+拓扑)
│   │   ├── action_space.py             # 动作空间 (任务-AGV分配)
│   │   └── reward.py                   # 奖励函数 (makespan, distance, energy, collision)
│   │
│   ├── models/                         # 神经网络模型
│   │   ├── __init__.py
│   │   ├── encoder.py                  # 图注意力编码器 (AGV节点+订单节点+拓扑边)
│   │   ├── hete_attention.py           # HeteAttn 异构注意力层
│   │   ├── tightness_encoder.py        # 约束紧度编码器 (安全/电量/时效)
│   │   ├── expert.py                   # 专家子网络 (各约束维度特化)
│   │   ├── gating.py                   # TGate 门控网络
│   │   ├── moe_layer.py               # 多专家融合层 (组装 Expert+TGate)
│   │   ├── decoder.py                  # 集中式解码器 (任务→AGV 分配)
│   │   ├── masks.py                    # 可行解掩码 (能力/电量/碰撞/安全/时序)
│   │   └── meha.py                     # MEHA 完整模型
│   │
│   ├── baselines/                      # 基准方法
│   │   ├── __init__.py
│   │   ├── fcfs.py                     # FCFS 调度器 (通过 MQTT 下发)
│   │   ├── nearest_first.py            # 最近邻贪心调度器
│   │   ├── am_model.py                 # Attention Model [15]
│   │   └── pomo_model.py               # POMO [16]
│   │
│   ├── training/                       # 训练
│   │   ├── __init__.py
│   │   ├── trainer.py                  # REINFORCE with baseline
│   │   ├── pretrain_experts.py         # 阶段1: 各专家独立预训练
│   │   ├── train_gating.py             # 阶段2: 门控+专家联合训练
│   │   └── train_baselines.py          # 基准方法训练入口
│   │
│   ├── evaluation/                     # 评估
│   │   ├── __init__.py
│   │   ├── evaluator.py                # 通用评估器 (通过 MQTT 运行远端仿真)
│   │   ├── metrics.py                  # 指标: TD, Makespan, Energy, CollisionCount, Gap
│   │   └── compare_methods.py          # 方法间统计对比 (Wilcoxon test)
│   │
│   ├── data/                           # 数据生成
│   │   ├── __init__.py
│   │   ├── generator.py                # 问题实例生成器 (随机拓扑+订单)
│   │   ├── distribution.py             # 分布采样器 (参数空间采样)
│   │   └── dataset.py                  # PyTorch Dataset 封装
│   │
│   └── utils/                          # 工具
│       ├── __init__.py
│       ├── config.py                   # 配置加载
│       ├── logger.py                   # 日志
│       └── constants.py               # 全局常量
│
├── configs/                            # 配置文件
│   ├── default.yaml                    # 默认超参数
│   ├── mqtt_broker.yaml                # MQTT broker 地址、端口、认证
│   ├── remote_agvs.yaml                # 远端 AGV 实例清单 (manufacturer, serial, map)
│   ├── distributions/                  # 分布配置 (下发至远端的参数组合)
│   │   ├── train.yaml
│   │   ├── test1_same.yaml
│   │   ├── test2_high_order.yaml
│   │   ├── test3_low_order.yaml
│   │   ├── test4_hetero_agv.yaml
│   │   ├── test5a_large_map.yaml
│   │   ├── test5b_larger_map.yaml
│   │   ├── test6a_few_agv.yaml
│   │   ├── test6b_many_agv.yaml
│   │   ├── test7a_loose_safety.yaml
│   │   ├── test7b_strict_safety.yaml
│   │   ├── test8a_high_battery.yaml
│   │   ├── test8b_low_battery.yaml
│   │   ├── test9a_low_freq.yaml
│   │   └── test9b_high_freq.yaml
│   └── baselines/                      # 基准方法配置
│       ├── fcfs.yaml
│       ├── nearest_first.yaml
│       ├── am.yaml
│       ├── pomo.yaml
│       ├── am_multidist.yaml
│       └── pomo_multidist.yaml
│
├── scripts/                            # 运行脚本
│   ├── train_meha.sh                   # 训练 MEHA
│   ├── train_baselines.sh              # 训练所有基准方法
│   ├── eval_e1_same_dist.sh            # E1: 同分布测试
│   ├── eval_e2_cross_dist.sh           # E2: 跨分布测试
│   ├── eval_e3_cross_scale.sh          # E3: 跨规模测试
│   ├── eval_e4_ablation.sh             # E4: 消融实验
│   ├── eval_e5_data_aug.sh             # E5: 数据增强对照
│   ├── eval_e6_expert_count.sh         # E6: 专家数量实验
│   ├── eval_e7_inference_time.sh       # E7: 推理效率
│   └── visualize_gating.py            # 门控权重可视化
│
├── tests/                              # 单元测试
│   ├── test_mqtt_client.py             # MQTT 连接与消息收发测试
│   ├── test_env_wrapper.py             # 环境封装测试 (mock MQTT)
│   ├── test_warehouse_env.py           # Gym 环境测试
│   ├── test_hete_attention.py
│   ├── test_gating.py
│   ├── test_masks.py
│   └── test_meha.py
│
├── results/                            # 实验结果 (gitignore)
│   ├── e1_same_dist/
│   ├── e2_cross_dist/
│   ├── e3_cross_scale/
│   ├── e4_ablation/
│   ├── e5_data_aug/
│   ├── e6_expert_count/
│   ├── e7_inference/
│   └── figures/
│
└── notebooks/                          # 分析笔记本
    ├── 01_data_exploration.ipynb
    ├── 02_result_analysis.ipynb
    └── 03_gating_visualization.ipynb
```

---

## 第三部分：各实验详细设计（基于 SimAGV3.0）

### E1: 同分布基准对比 (§5.2.1)

```
目的: 验证 MEHA 在训练分布上没有性能退化

训练:
  所有 DRL 方法在 D_train 上训练 (相同实例数，相同训练步数)
  FCFS / Nearest-First 无需训练，直接评估

测试:
  在 D_train 参数下生成 1000 个未见过的测试实例
  每个实例通过 MQTT 向远端 SimAGV3.0 下发订单，采集 state topic 直至完成
  DRL 方法: greedy decoding (单次) + beam search (beam=128)

远端 SimAGV3.0 输出指标 (通过 MQTT state topic 采集):
  - 总行驶距离 (Total Distance, TD)           ← state/visualization 中累计路径长度
  - Makespan (所有订单完成时间)                 ← 首个订单下发至最后订单完成的 wall-clock 时间
  - 总能耗 (Total Energy)                      ← state 中 batteryLevel 的累计消耗
  - 碰撞事件数 (Collision Count)               ← state.errors 中 collision 类型计数
  - 急停触发次数 (Emergency Stop Count)        ← state.errors 中 emergencyStop 类型计数

归一化指标:
  - Gap to Nearest-First (%)
  - Gap to POMO (%)

输出表格:
  | Method          | TD ↓ | Makespan ↓ | Energy ↓ | Collisions ↓ | Gap to POMO ↓ |
  |-----------------|------|------------|----------|-------------|---------------|
  | FCFS (SimAGV3)  | —    | —          | —        | —           | —             |
  | Nearest-First   | —    | —          | —        | —           | —             |
  | AM              | —    | —          | —        | —           | —             |
  | POMO            | —    | —          | —        | —           | 0.00%         |
  | MEHA (Ours)     | —    | —          | —        | —           | ≤0.5%         |

成败判定: MEHA的 Gap to POMO ≤ 0.5%，且碰撞事件数不显著增加
```

### E2: 跨分布泛化 (§5.2.2)

```
目的: 验证 Multi-Expert+TGate 解决跨分布退化的核心主张

测试: 每个测试分布 1000 实例
      所有方法使用 D_train 上训练的权重 (无微调) 直接测试
      通过 SimAGV3.0 运行完整仿真获取真实指标

SimAGV3.0 约束维度变化:
  D_test2 (高订单)    → 考验调度密度上限
  D_test4 (异构AGV)   → 考验对车辆能力差异 (尺寸/速度) 的适应
  D_test7b (严格安全) → 考验安全约束调度，safety_factor=2.0 大幅限制并行度
  D_test8b (低电量)   → 考验电量约束下的充电调度策略
  D_test9b (高频实时) → 考验低延迟决策 (每100ms需响应)

指标: Degradation Rate = (Gap_test - Gap_train) / Gap_train × 100%

输出格式 (每个分布一张表 + 汇总图):
  D_test7b 严格安全 (safety_factor=2.0):
  | Method          | TD   | Gap to NF | Collisions | Degradation Rate |
  |-----------------|------|----------|------------|------------------|
  | FCFS            | —    | —        | —          | —                |
  | AM              | —    | —        | —          | +X%              |
  | POMO            | —    | —        | —          | +Y%              |
  | AM-MultiDist    | —    | —        | —          | +Z%              |
  | POMO-MultiDist  | —    | —        | —          | +W%              |
  | MEHA (Ours)     | —    | —        | 0           | **+V%** (最小)   |

汇总柱状图: x轴=10个测试分布, y轴=退化率, 6条柱子(方法), MEHA标注

成败判定: 
  - MEHA在所有测试分布上的退化率 ≤ 单模型方法的 50%
  - 在极端分布 (D_test7b严格安全, D_test8b低电量) 上的优势更显著 (≥70%降幅)
  - D_test7a (宽松安全) 考验模型是否会"过度保守"，MEHA的门控应自动放松安全约束
  - D_test9b (严格时效) 考验实时性压力下门控的快速适应能力
  - SimAGV3.0 的碰撞事件数作为硬约束验证：MEHA不应产生额外碰撞
```

### E3: 跨规模泛化 (§5.2.3)

```
目的: 测试模型对不同地图规模/AGV数量的适应能力

规模轴 (固定其他参数为 D_train):
  地图规模: Phase2_testmap → beidaceshi-0819 → beidaceshi-0205 → floors-0311-2
     (station数: ~15 → ~30 → ~50 → ~80)
  num_agvs:  [5, 10, 15, 20, 30]
  num_orders: 按 station 数量等比例缩放

输出:
  两条曲线图:
  图1: x轴=num_stations, y轴=Gap to Nearest-First, 多条线(方法)
  图2: x轴=num_agvs, y轴=Makespan (SimAGV3.0 实测), 多条线(方法)

SimAGV3.0 关键瓶颈点:
  - 大地图上 A* 路由时间增加 (num_stations > 50 时明显)
  - 多 AGV 安全范围重叠频率随 AGV 数非线性增长
  - 碰撞检测 SAT 计算量 O(K² × N) (K=AGV数, N=多边形边数)

成败判定: MEHA的Gap增长率 ≤ POMO的Gap增长率的 60%
```

### E4: 消融实验 (§5.3.1)

```
目的: 独立验证HeteAttn, Multi-Expert, TGate各自的贡献

消融变体:
  ┌─────────────────────────────────────────────────────┐
  │ 变体                │ HeteAttn │ Expert │ TGate     │
  ├─────────────────────────────────────────────────────┤
  │ Full MEHA           │    ✓     │   ✓    │    ✓      │
  │ w/o HeteAttn        │    ✗     │   ✓    │    ✓      │
  │ w/o Expert          │    ✓     │   ✗    │    ✗      │
  │ w/o TGate (uniform) │    ✓     │   ✓    │ uniform   │
  │ Baseline (POMO)     │    ✗     │   ✗    │    ✗      │
  └─────────────────────────────────────────────────────┘

测试: D_train + 5个代表性跨分布
      (D_test2高订单, D_test4异构AGV, D_test7b严格安全, D_test8b低电量, D_test9b高频)

输出堆叠条形图:
  横向: 5个分布
  各bar段: w/o HeteAttn ↓ / w/o Expert ↓ / w/o TGate ↓
           (相对于 Full MEHA 的退化量，SimAGV3.0 Makespan/TD 测量)

成败判定:
  - w/o Expert 退化最大 (验证核心贡献)
  - w/o HeteAttn 在 D_test4 (异构AGV) 上退化显著 (验证异构注意力必要性)
  - SimAGV3.0 碰撞数作为定性参考（消融变体不应显著增加碰撞）
```

### E5: 数据增强对照 (§5.3.1 核心消融)

```
目的: 区分"多分布采样"与"多专家架构"的贡献

关键对比:
  ┌────────────────────┬──────────────┬──────────────┐
  │ 方法               │ 训练方式     │ 模型架构     │
  ├────────────────────┼──────────────┼──────────────┤
  │ AM                  │ 单分布       │ 单模型       │
  │ AM-MultiDist        │ 多分布采样   │ 单模型       │
  │ MEHA (Ours)         │ 多分布采样   │ 多专家       │
  └────────────────────┴──────────────┴──────────────┘

期望结果 (D_test7b 严格安全为例，SimAGV3.0 Makespan 测量):
  | 方法          | Makespan | Collisions |
  |---------------|----------|------------|
  | AM            | 850s     | 3          |  ← 单分布过拟合，安全约束处理不当
  | AM-MultiDist  | 720s     | 1          |  ← 数据增强改善，但仍偶有碰撞
  | MEHA (Ours)   | 680s     | 0          |  ← 多专家再改善 + 零碰撞 ✦核心证据✦

同样在 D_test8b (低电量) 和 D_test9b (高频) 上验证该模式，
确保多专家的优势在不同约束维度上一致成立。

SimAGV3.0 硬约束验证:
  - 碰撞事件数: MEHA 应保持 0
  - 急停触发数: MEHA 应保持 0
  - 订单超时数: 记录各方法的超时率

统计检验: 
  Wilcoxon signed-rank test on 1000 instance pairs
  H₀: Gap(MEHA) = Gap(AM-MultiDist)
  需要 p < 0.01

成败判定: MEHA vs AM-MultiDist 差异统计显著 (p < 0.01)
          且效果量 (effect size) > 小 (Cohen's d > 0.2)
```

### E6: 专家数量影响 (§5.3.2)

```
目的: 探索最优专家数 K

实验设置:
  K ∈ {1, 2, 4, 6, 8, 12, 16}
  总参数量尽量保持可比 (调整每个专家的hidden_dim)

测试: D_train + D_test2 + D_test4 + D_test7b + D_test8b + D_test9b (覆盖6种约束维度)

输出:
  双y轴图:
    左y轴 (线): Gap to Nearest-First (越低越好, SimAGV3.0 Makespan测量)
    右y轴 (虚线): 训练时间 (h)
    x轴: K

  门控权重矩阵热力图:
    行: K个专家
    列: 6个测试分布
    颜色: 门控权重 wₖ
    解释: 每列对应的 SimAGV3.0 约束维度
      D_test2   → "高密度调度专家"
      D_test4   → "异构车辆适配专家"
      D_test7b  → "严格安全约束专家"
      D_test8b  → "电量约束调度专家"
      D_test9b  → "实时性优先专家"

成败判定: 
  - 识别K的最优区间 (预期4~6)
  - 门控热力图显示清晰的分布特化模式 (每列有1~2个主导专家)
  - 不同 SimAGV3.0 约束维度的专家分配应形成差异化
```

### E7: 推理效率 (§5.3.3)

```
目的: 验证MEHA满足 SimAGV3.0 实时调度需求

测试设置:
  SimAGV3.0 典型 tick 周期: 100ms (高频) ~ 500ms (低频)
  硬件: 单 NVIDIA RTX 3090

测试实例 (SimAGV3.0 实测规模):
  D_train:     15 stations, 10 AGV, 50 orders
  D_test5a:    30 stations, 20 AGV, 150 orders
  D_test5b:    80 stations, 30 AGV, 300 orders

输出:
  | Method          | Small (ms) | Medium (ms) | Large (ms) |
  |-----------------|-----------|------------|-----------|
  | FCFS            | <1        | <1         | <1        |
  | Nearest-First   | 5         | 20         | 80        |
  | AM              | 5         | 15         | 40        |
  | POMO            | 8         | 20         | 55        |
  | MEHA (Ours)     | 15        | 35         | 80        |

成败判定: 
  MEHA推理时间 < 100ms (SimAGV3.0 最快 tick 周期)
  足够在单次 tick 内完成决策并下发 VDA5050 订单

MEHA额外开销分解 (相对 AM 在 Medium 规模):
  | 组件             | 额外耗时 (ms) | 对应 SimAGV3.0 环节       |
  |-----------------|--------------|--------------------------|
  | HeteAttn        | +2           | AGV 能力编码 (尺寸/速度)   |
  | TGate           | +1           | 约束情境门控路由           |
  | Multi-Expert    | +5           | 多约束维度并行推理         |
  | 可行掩码         | +2           | 安全/电量/碰撞预过滤       |
  | 总计            | +10 vs AM    |                          |
```

---

## 第四部分：实验执行顺序与依赖

```
阶段 0: 环境搭建
  ├── 确认远端 SimAGV3.0 已部署运行 (MQTT broker 可达)
  ├── simagv3_bridge/ MQTT 桥接层实现 (MQTT client, order builder, state parser)
  ├── Gym 环境封装 (warehouse_env.py, 内含 MQTT loop)
  └── 单元测试通过 (test_mqtt_client.py → mock MQTT 验证消息格式)

阶段 1: 基准方法训练 (并行)
  ├── 实现 FCFS / Nearest-First (无需训练, 通过 MQTT 下发)
  ├── 训练 AM (on D_train, 通过 MQTT 与远端交互)
  ├── 训练 POMO (on D_train)
  ├── 训练 AM-MultiDist (on multi-dist)
  └── 训练 POMO-MultiDist (on multi-dist)

阶段 2: MEHA 训练 (依赖 阶段0+1)
  ├── 2a: 各Expert独立预训练
  │     K=4~6个专家，覆盖 SimAGV3.0 约束维度:
  │     (高订单密度 / 异构AGV / 严格安全 / 低电量 / 高频实时)
  └── 2b: TGate联合训练 (在全部测试分布上微调门控)

阶段 3: 评估 (依赖 阶段1+2)
  ├── E1: 同分布 → 快速, 先跑
  ├── E2: 跨分布 → 核心实验 (SimAGV3.0 全仿真)
  ├── E3: 跨规模 → 与E2并行 (需准备多地图)
  ├── E4: 消融   → 训练消融变体后跑
  ├── E5: 数据增强对照 → 与E2数据共用
  ├── E6: 专家数量 → 训练K=1,2,4,6,8,12,16后跑
  └── E7: 推理效率 → 最后跑, 仅推断

阶段 4: 分析与可视化
  ├── 生成所有论文图表
  ├── 门控权重与 SimAGV3.0 约束维度的对应分析
  └── SimAGV3.0 trace 日志分析 (碰撞事件、急停、超时)
```

---

## 第五部分：论文中需呈现的图表清单

| 编号 | 类型 | 内容 | 所属小节 |
|------|------|------|----------|
| Fig.1 | 架构图 | MEHA + 远端 SimAGV3.0 整体框架图（DRL调度层→MQTT桥接→远端仿真基座） | §4.1 |
| Fig.2 | 示意图 | HeteAttn 异构注意力：AGV节点(尺寸/速度/电量) vs 订单节点的分组注意力 | §4.2.2 |
| Fig.3 | 示意图 | SimAGV3.0 安全模块：SAT 多边形碰撞 + AABB 安全范围重叠 + 前向雷达 | §3.1 |
| Fig.4 | 柱状图 | E2: 各分布退化率对比 (6方法 × 10分布) | §5.2.2 |
| Fig.5 | 折线图 | E3: 跨规模性能曲线 (x=地图station数/AGV数, y=SimAGV3.0 Makespan) | §5.2.3 |
| Fig.6 | 堆叠柱状图 | E4: 消融退化量分解 (5分布, SimAGV3.0 实测 Makespan 退化) | §5.3.1 |
| Fig.7 | 双y轴图 | E6: 专家数量 vs 性能 & 训练时间 | §5.3.2 |
| Fig.8 | 热力图 | E6: 门控权重矩阵 (K×6约束维度, 标注对应 SimAGV3.0 参数变化) | §5.3.2 |
| Fig.9 | 表格 | E1: 同分布性能对比 (含 SimAGV3.0 碰撞/急停计数) | §5.2.1 |
| Fig.10| 表格 | E7: 推理时间对比 (vs SimAGV3.0 tick 周期) | §5.3.3 |
| Fig.11| 热力图 | E5: SimAGV3.0 碰撞事件分布 (MEHA vs 单模型方法) | §5.3.1 附录 |

---

## 第六部分：MQTT 桥接技术要点

### 6.1 DRL 训练循环与远端 SimAGV3.0 交互（MQTT 异步模式）

```
for episode in range(N):
    # 通过 MQTT broker 连接已部署的远端 SimAGV3.0 实例
    env = MqttBatchRunner(mqtt_config, remote_agvs, dist_config)
    obs = env.reset()                            # 向远端发送 instantActions(reset)
    done = False
    while not done:
        action = meha_model(obs)                 # DRL 决策: 订单→AGV 分配
        # env.step() 内部:
        #   1. 将 action 转换为 VDA5050 Order JSON
        #   2. MQTT publish 至 uagv/{mfr}/{serial}/order
        #   3. MQTT subscribe 等待 uagv/{mfr}/{serial}/state 更新
        #      (远端 SimAGV3.0 在 tickOnce() 中执行运动/碰撞/电池)
        #   4. 解析 state JSON → next_obs
        #   5. 计算 reward
        next_obs, reward, done, info = env.step(action)
        replay_buffer.add(obs, action, reward, next_obs, done)
        obs = next_obs
    meha_model.update(replay_buffer)             # REINFORCE with baseline
```

### 6.2 MQTT 消息流时序

```
 DRL Agent                MQTT Broker              远端 SimAGV3.0
    │                         │                         │
    │── order publish ──────→│── order forward ───────→│
    │                         │                         │── acceptVdaOrder()
    │                         │                         │── tickOnce() × N
    │                         │                         │   (motion + collision + battery)
    │                         │                         │── publish state
    │←─ state received ──────│←─ state forward ────────│
    │                         │                         │
    │ (决策循环: 解析 state → DRL 推理 → 下发下一轮 order)
    │                         │                         │
```

### 6.3 观测空间映射（从 MQTT state JSON 构建）

| MQTT state 字段 | 观测变量 | 维度 |
|-----------------|---------|------|
| `agvPosition.x, .y, .theta` | AGV 位置 + 朝向 | 3 × N_agv |
| `batteryState.batteryCharge` | 电量百分比 | N_agv |
| `operatingMode` + `driving` | 状态 (IDLE/EXECUTING/CHARGING) | N_agv |
| `loads[].loadState` | 负载 (EMPTY/LOADED) | N_agv |
| 本地下发的 order nodes | 待分配订单节点位置 | 2 × Σnodes |
| 远端 factsheet 中的 topology | 站点位置 + 边连接 | 2×N_stations + N_edges×2 |
| 远端 config (safety params) | 安全距离参数 | 2 |
| `batteryState.batteryHealth` | 电池健康状态 | N_agv |

### 6.4 奖励函数设计

```
R = -α₁ · episode_makespan
    - α₂ · Σ agv_path_length         (from MQTT visualization topic 累计)
    - α₃ · Σ battery_consumed        (from MQTT state batteryCharge 变化)
    - α₄ · collision_count            (from MQTT state errors[] collision type)
    - α₅ · emergency_stop_count       (from MQTT state errors[] emergencyStop type)
    + α₆ · task_completion_rate

其中 α₄, α₅ 系数在训练时为小正值(软约束)，评估时为 0。
碰撞/急停信息来源于远端 SimAGV3.0 的 SAT+安全监控模块，通过 MQTT 传回。
```

### 6.5 关键注意事项

1. **MQTT 延迟**：网络往返延迟 (RTT) 约 5-50ms，需要在 D_train 中通过 `publish_interval` 参数建模
2. **断线重连**：MQTT client 需实现自动重连 + QoS1，确保订单不丢失
3. **时钟同步**：本项目与远端 SimAGV3.0 使用各自的系统时钟，Makespan 以本项目 wall-clock 为准
4. **多 AGV 并行**：通过 MQTT 的 topic 层级 (`uagv/{serial}/...`) 区分不同 AGV 实例
5. **训练加速**：可同时操作多个远端 SimAGV3.0 实例（不同 serial），并行采集 episode 数据

---

> **状态：实验设计已完成，可进入 Phase 4 全文撰写**  
> 代码结构对应工程实现，论文§5直接引用此设计。  
> **SimAGV3.0 部署于远端系统，本项目仅通过 MQTT 协议（VDA5050 标准）与其交互。**
