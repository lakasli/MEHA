import type { Experiment } from "@/types/experiment";

/**
 * The seven experiments from §1 of the experimental design doc.
 * Copy stays close to the source so the platform reads as the paper's
 * companion tool, not a generic dashboard.
 */
export const experiments: Experiment[] = [
  {
    key: "E1",
    title: "同分布基准测试",
    subtitle: "同分布基准对比",
    section: "§5.2.1",
    question: "MEHA 在训练分布上能否匹配 POMO？",
    expected: "与 POMO 的差距在 ±0.5% 以内，且无新增碰撞。",
    distributions: ["D_train", "D_test1 (same)"],
    paramGroups: [
      {
        label: "训练分布",
        items: [
          { name: "map_id", value: "Phase2_testmap", note: "拓扑地图文件" },
          { name: "num_agvs", value: "10" },
          { name: "num_orders", value: "50" },
          { name: "nodes_per_order", value: "4" },
          { name: "max_speed", value: "1.0", unit: "m/s" },
        ],
      },
      {
        label: "评估",
        items: [
          { name: "test_instances", value: "1000", note: "未见过的随机种子" },
          { name: "decoding", value: "greedy + beam(128)" },
          { name: "metrics", value: "TD, Makespan, Energy, Collisions, Gap" },
        ],
      },
      {
        label: "安全与电池",
        items: [
          { name: "safety_factor", value: "1.3" },
          { name: "warning_distance", value: "1.0", unit: "m" },
          { name: "battery_capacity", value: "100", unit: "Ah" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "等待 AGV 上线" },
      { key: "dispatch", label: "下发 VDA5050 订单", detail: "1000 实例 × 7 种方法，MQTT 发布" },
      { key: "collect", label: "采集状态主题", detail: "位置、电量、错误，直至每个订单完成" },
      { key: "compute", label: "计算指标与差距", detail: "总距离、完工时间、能耗、碰撞次数与 POMO 对比" },
      { key: "done", label: "完成", detail: "结果表已写入 results/e1_same_dist/" },
    ],
  },
  {
    key: "E2",
    title: "跨分布泛化",
    subtitle: "跨分布泛化",
    section: "§5.2.2",
    question: "多专家 + 门控机制能否降低跨分布性能衰减？",
    expected: "MEHA 在 10 个分布上的衰减不超过单模型方法的 50%。",
    distributions: ["D_test2", "D_test4", "D_test7b", "D_test8b", "D_test9b", "+5 more"],
    paramGroups: [
      {
        label: "压力分布",
        items: [
          { name: "D_test2", value: "num_orders=200", note: "高订单密度" },
          { name: "D_test4", value: "heterogeneous", note: "混合 AGV 规格" },
          { name: "D_test7b", value: "safety_factor=2.0", note: "严格安全约束" },
          { name: "D_test8b", value: "50Ah / 0.05", note: "低电量压力" },
          { name: "D_test9b", value: "publish=100ms", note: "高频实时" },
        ],
      },
      {
        label: "协议",
        items: [
          { name: "instances_per_dist", value: "1000" },
          { name: "weights", value: "D_train only", note: "无微调" },
          { name: "metric", value: "Degradation Rate = (Gap_test − Gap_train) / Gap_train" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "10 个分布分阶段执行" },
      { key: "dispatch", label: "运行 10000 实例", detail: "6 种方法 × 10 个分布 × 1000 实例" },
      { key: "collect", label: "采集 SimAGV3.0 轨迹", detail: "状态错误 → 碰撞、紧急停止" },
      { key: "compute", label: "计算衰减率", detail: "按方法、按分布" },
      { key: "done", label: "完成", detail: "柱状图 + 各分布结果表" },
    ],
  },
  {
    key: "E3",
    title: "跨规模泛化",
    subtitle: "跨规模泛化",
    section: "§5.2.3",
    question: "MEHA 能否适应不同地图规模和 AGV 数量？",
    expected: "MEHA 的差距增长不超过 POMO 增长曲线的 60%。",
    distributions: ["D_train", "D_test5a", "D_test5b", "D_test6a", "D_test6b"],
    paramGroups: [
      {
        label: "规模维度",
        items: [
          { name: "map progression", value: "Phase2 → beidaceshi → floors-0311-2", note: "15 → 80 个站点" },
          { name: "num_agvs", value: "{5, 10, 15, 20, 30}" },
          { name: "num_orders", value: "∝ stations" },
        ],
      },
      {
        label: "监控瓶颈",
        items: [
          { name: "A* routing", value: ">50 stations", note: "路径时间增长" },
          { name: "SAT collision", value: "O(K²·N)", note: "K=AGV 数量，N=多边形边数" },
          { name: "safety overlap", value: "non-linear", note: "随 AGV 数量变化" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "4 张地图 × 5 种 AGV 数量" },
      { key: "dispatch", label: "运行规模扫描", detail: "20 种配置 × 1000 实例" },
      { key: "collect", label: "采集完工时间与 A* 耗时", detail: "各规模状态轨迹" },
      { key: "compute", label: "绘制规模曲线", detail: "差距 vs 站点数，完工时间 vs AGV 数" },
      { key: "done", label: "完成", detail: "折线图已写入 results/e3_cross_scale/" },
    ],
  },
  {
    key: "E4",
    title: "模块消融",
    subtitle: "消融实验",
    section: "§5.3.1",
    question: "每个模块（HeteAttn、Expert、TGate）的贡献有多大？",
    expected: "Expert > TGate > HeteAttn；HeteAttn 在 D_test4 上最为关键。",
    distributions: ["D_train", "D_test2", "D_test4", "D_test7b", "D_test8b", "D_test9b"],
    paramGroups: [
      {
        label: "消融变体",
        items: [
          { name: "Full MEHA", value: "✓ ✓ ✓" },
          { name: "w/o HeteAttn", value: "✗ ✓ ✓", note: "替换为普通注意力机制" },
          { name: "w/o Expert", value: "✓ ✗ ✗", note: "单专家模式" },
          { name: "w/o TGate", value: "✓ ✓ uniform", note: "固定 1/K 路由" },
        ],
      },
      {
        label: "输出",
        items: [
          { name: "chart", value: "stacked bar", note: "与完整 MEHA 的衰减对比" },
          { name: "metric", value: "ΔMakespan, ΔTD", note: "SimAGV3.0 实测" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "5 种变体 × 6 个分布" },
      { key: "dispatch", label: "训练与评估消融实验", detail: "30 组变体/分布运行" },
      { key: "collect", label: "采集 SimAGV3.0 完工时间", detail: "与完整 MEHA 基线对比" },
      { key: "compute", label: "计算衰减差值", detail: "各模块贡献归因" },
      { key: "done", label: "完成", detail: "堆叠柱状图已写入 results/e4_ablation/" },
    ],
  },
  {
    key: "E5",
    title: "数据增强对照",
    subtitle: "数据增强对照",
    section: "§5.3.1",
    question: "多专家是否优于单纯的多分布采样？",
    expected: "MEHA 对比 AM-MultiDist 具有显著性（p < 0.01, Cohen's d > 0.2）。",
    distributions: ["D_test7b", "D_test8b", "D_test9b"],
    paramGroups: [
      {
        label: "对照比较",
        items: [
          { name: "AM", value: "single-dist · single-model" },
          { name: "AM-MultiDist", value: "multi-dist · single-model" },
          { name: "MEHA (ours)", value: "multi-dist · multi-expert" },
        ],
      },
      {
        label: "统计检验",
        items: [
          { name: "test", value: "Wilcoxon signed-rank", note: "1000 组配对实例" },
          { name: "H₀", value: "Gap(MEHA) = Gap(AM-MultiDist)" },
          { name: "threshold", value: "p < 0.01, d > 0.2" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "3 个压力分布" },
      { key: "dispatch", label: "运行配对实例", detail: "1000 对 × 3 个分布" },
      { key: "collect", label: "采集碰撞次数与完工时间", detail: "MEHA 预期零碰撞" },
      { key: "compute", label: "执行 Wilcoxon 检验", detail: "p 值 + Cohen's d" },
      { key: "done", label: "完成", detail: "显著性报告已写入 results/e5_data_aug/" },
    ],
  },
  {
    key: "E6",
    title: "专家数量扫描",
    subtitle: "专家数量影响",
    section: "§5.3.2",
    question: "最优专家数量 K 是多少？",
    expected: "K = 4–6，且各分布上专家分工明确。",
    distributions: ["D_train", "D_test2", "D_test4", "D_test7b", "D_test8b", "D_test9b"],
    paramGroups: [
      {
        label: "扫描",
        items: [
          { name: "K", value: "{1, 2, 4, 6, 8, 12, 16}" },
          { name: "param_budget", value: "matched", note: "按 K 调整隐藏层维度" },
        ],
      },
      {
        label: "输出结果",
        items: [
          { name: "curve", value: "Gap vs K", note: "左坐标轴" },
          { name: "curve", value: "Train time vs K", note: "右坐标轴" },
          { name: "heatmap", value: "K × 6 gating weights", note: "各分布专家专业化程度" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "7 个 K 值 × 6 个分布" },
      { key: "dispatch", label: "训练 K 值变体", detail: "在匹配的参数预算下" },
      { key: "collect", label: "评估并记录门控权重", detail: "每个实例的 wₖ 权重" },
      { key: "compute", label: "确定最优 K 值区间", detail: "曲线与热力图综合分析" },
      { key: "done", label: "完成", detail: "双轴图 + 门控热力图" },
    ],
  },
  {
    key: "E7",
    title: "推理效率",
    subtitle: "推理效率",
    section: "§5.3.3",
    question: "MEHA 能否在 SimAGV3.0 的时钟预算内完成推理？",
    expected: "MEHA 在所有规模上均小于 100ms——符合 100ms 时钟周期。",
    distributions: ["D_train (small)", "D_test5a (medium)", "D_test5b (large)"],
    paramGroups: [
      {
        label: "硬件",
        items: [
          { name: "GPU", value: "1× NVIDIA RTX 3090" },
          { name: "batch", value: "1", note: "在线服务" },
        ],
      },
      {
        label: "测试实例",
        items: [
          { name: "small", value: "15 stns · 10 AGV · 50 orders" },
          { name: "medium", value: "30 stns · 20 AGV · 150 orders" },
          { name: "large", value: "80 stns · 30 AGV · 300 orders" },
        ],
      },
      {
        label: "预算",
        items: [
          { name: "tick floor", value: "100", unit: "ms", note: "SimAGV3.0 最快时钟周期" },
        ],
      },
    ],
    stages: [
      { key: "connect", label: "连接 MQTT 代理", detail: "3 种实例规模" },
      { key: "dispatch", label: "运行 1000 次推理", detail: "每种方法 × 每种规模" },
      { key: "collect", label: "分析各组件耗时", detail: "HeteAttn / TGate / Expert / Masks 各组件" },
      { key: "compute", label: "对比时钟预算", detail: "毫秒 vs 100ms 下限" },
      { key: "done", label: "完成", detail: "耗时表 + 详细分解" },
    ],
  },
];

export const experimentsByKey: Record<string, Experiment> = Object.fromEntries(
  experiments.map((e) => [e.key, e]),
);
