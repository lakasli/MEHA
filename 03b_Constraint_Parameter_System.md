# 工业仓储异构AGV调度 — 约束参数体系

> 生成日期：2026-06-25  
> 所属管线：academic-paper / Phase 3 补充  
> 用途：嵌入 §3 问题建模 + §4.4.3 可行解掩码设计

---

## 1. 异构AGV类型参数化

### 1.1 车辆类型定义

定义AGV类型集合 `T = {L, F, B}`：

| 类型 | 代号 | 名称 | 负载能力 | 典型物理尺寸 (l×w×h, m) | 空载重量 (kg) |
|------|------|------|----------|--------------------------|---------------|
| Type 1 | **L** | 潜伏车 (Latent AGV) | 单件负载 (K_L = 1) | 1.2×0.8×0.3 | 200 |
| Type 2 | **F** | 叉车 (Forklift AGV) | 单件负载 (K_F = 1) | 2.0×1.2×2.5 | 800 |
| Type 3 | **B** | 料箱车 (Bin-carrying AGV) | 多件负载 (K_B ≥ 1, 可配置) | 1.5×1.0×1.8 | 400 |

```
每辆AGV aᵢ 的类型属性:
  type(aᵢ) ∈ T
  max_load_count(aᵢ) = K_type  (最大可载负载件数)
  base_length(aᵢ), base_width(aᵢ), base_height(aᵢ)  (空载尺寸)
```

### 1.2 运动学参数

每类AGV的完整运动学参数矩阵：

| 参数 | 符号 | 潜伏车 (L) | 叉车 (F) | 料箱车 (B) | 单位 |
|------|------|-----------|---------|-----------|------|
| 最大行驶速度 | v_max | 2.0 | 1.5 | 1.8 | m/s |
| 最小行驶速度 | v_min | 0.1 | 0.1 | 0.1 | m/s |
| 最大加速度 | a_acc | 0.8 | 0.5 | 0.6 | m/s² |
| 最大减速度 | a_dec | 1.0 | 0.8 | 0.8 | m/s² |
| 最大旋转角速度 | ω_max | 1.0π (180°/s) | 0.5π (90°/s) | 0.8π (144°/s) | rad/s |
| 旋转时线速度上限 | v_rot_max | 0.3 | 0.2 | 0.25 | m/s |

```
运动学约束:
  ∀a, ∀t:  v(a,t) ∈ [v_min(type), v_max(type)]
  ∀a, ∀t:  |dv/dt| ≤ a_acc(type)  (加速)
  ∀a, ∀t:  |dv/dt| ≤ a_dec(type)  (减速)
  转弯时:   v(a,t) ≤ v_rot_max(type) 且 |ω(a,t)| ≤ ω_max(type)
```

### 1.3 电力参数

| 参数 | 符号 | 潜伏车 (L) | 叉车 (F) | 料箱车 (B) | 单位 |
|------|------|-----------|---------|-----------|------|
| 电池容量 | E_cap | 2.0 | 5.0 | 3.5 | kWh |
| 空载行驶能耗率 | e_travel₀ | 80 | 200 | 120 | W·h/m |
| 满载行驶能耗率 | e_travel₁ | 120 | 350 | 180 | W·h/m |
| 负载单位重量附加能耗 | e_load | 0.5 | 1.2 | 0.8 | W·h/(m·kg) |
| 旋转能耗率（单位弧度） | e_rot | 15 | 40 | 25 | W·h/rad |
| 待机能耗率 | e_idle | 30 | 50 | 40 | W/h |
| 充电功率 | P_charge | 1.0 | 2.0 | 1.5 | kW |
| 低电量阈值（需回充） | E_low | 20% | 20% | 20% | % of E_cap |

```
能耗模型:
  E_consumed(a, Δd, Δθ, Δt, load_weight) =
      e_travel₀(type) · Δd                           (空载基础行驶)
    + e_load(type) · load_weight · Δd                (负载重量附加)
    + [满载? e_travel₁ - e_travel₀ : 0] · Δd        (满载附加)
    + e_rot(type) · |Δθ|                             (旋转能耗)
    + e_idle(type) · Δt                              (待机能耗)

电量约束:
  ∀a, ∀t:  E_remain(a, t) ≥ E_low(type) · E_cap(type)
  当 E_remain ≤ E_low → 必须路由至充电站
```

---

## 2. 负载建模与异常旋转约束

### 2.1 负载属性

```
负载(load) 属性:
  - weight: 重量 (kg)
  - length, width, height: 标称尺寸 (m)
  - load_type: 正常/异常  {normal, abnormal}
  - rotation_offset: 非正常装载导致的旋转偏移角 θ_offset (仅abnormal时有效)
```

### 2.2 非正常装载的影响

当负载存在异常旋转（`load_type = abnormal`）时：

```
有效占用空间计算:
  - 正常情况下: 负载尺寸 = 标称尺寸，方向与AGV朝向一致
  - 异常情况下: 负载在水平面上的投影面积发生变化:
      occupied_rect(load, agv_heading) = rotate(load.length, load.width, θ_offset)
    
碰撞检测时:
  车辆+负载的组合包络 = bounding_box(agv_base_rect, load_occupied_rect)
  而非简单的 agv_base_rect + load_nominal_rect
```

### 2.3 组合碰撞模型

```
AGV组合包络计算:
  comb_length = max(agv_base_length, load_offset_x + load_rotated_length)
  comb_width  = max(agv_base_width,  load_offset_y + load_rotated_width)
  comb_height = agv_base_height + load.height (叉车举升时独立计算)

碰撞条件 (两AGV aᵢ, aⱼ):
  collision(aᵢ, aⱼ) ⟺ 
    |xᵢ - xⱼ| < (comb_lengthᵢ + comb_lengthⱼ) / 2  ∧
    |yᵢ - yⱼ| < (comb_widthᵢ  + comb_widthⱼ)  / 2  ∧
    head-to-head on same lane → 优先级判定
```

---

## 3. 双车道通路约束

### 3.1 仓库道路模型

```
仓库道路拓扑:
  - 网格地图 G = (V, E)
  - 每条边 e ∈ E 有属性:
      lane_type(e) ∈ {single_lane, double_lane}
      direction(e) ∈ {bidirectional, one_way_north, one_way_south, one_way_east, one_way_west}
      width(e): 通道物理宽度 (m)
      max_clearance(e): 最大可通行包络宽度 = width(e) - safety_margin
```

### 3.2 双车道碰撞检测

```
双车道 (lane_type = double_lane) 场景下的碰撞情形:

情形 1: 对向行驶 (head-on)
  两AGV在同一车道相向而行
  判定: 两车x/y投影重叠 ∧ 相对速度方向相反
  解决: 
    - 优先级规则: 载重AGV > 空载AGV > 低电量AGV
    - 需至少一辆车在避让点等待

情形 2: 同向追及 (rear-end)
  后方AGV速度 > 前方AGV速度, 间距缩小至安全距离以下
  判定: d(aᵢ, aⱼ) < d_safe(vᵢ, vⱼ) ∧ 同向

情形 3: 交叉口冲突 (intersection)
  两AGV在十字/T字交叉口路径交叉
  判定: 路径在时间窗口内有空间重叠
  解决: 集中式解码器中交叉口资源锁

情形 4: 异常负载旋转侵占邻道 (load-rotation encroachment)
  负载旋转偏移导致组合包络超出车道中线，侵占对向车道
  判定: comb_width / 2 > lane_half_width
  此时该车降级为单车道占用，对向车道禁止通行
```

### 3.3 安全距离模型

```
动态安全距离:
  d_safe(vᵢ, vⱼ) = d_min + t_react · |vᵢ - vⱼ| + (vᵢ² - vⱼ²) / (2 · a_dec)

  其中:
    d_min = 0.3m (最小静态间距)
    t_react = 0.2s (系统反应时间)
    a_dec = min(a_dec(typeᵢ), a_dec(typeⱼ))

双车道安全间距要求:
  - 同向行驶: d ≥ d_safe
  - 对向行驶: 需在避让点停靠，d ≥ d_min 作为停靠后最小间距
```

---

## 4. 时间建模（加速度约束下的行程时间）

### 4.1 行驶时间（含加速/减速）

```
给定行程距离 d，AGV类型参数 (v_max, a_acc, a_dec, v_rot_max, ω_max):

梯形速度剖面下的行驶时间:
  加速段时间:  t_acc = (v_max - v_start) / a_acc
  加速段距离:  d_acc = v_start · t_acc + 0.5 · a_acc · t_acc²
  减速段时间:  t_dec = (v_max - v_end) / a_dec
  减速段距离:  d_dec = v_max · t_dec - 0.5 · a_dec · t_dec²
  
  if d > d_acc + d_dec:  (可达v_max)
    t_travel = t_acc + t_dec + (d - d_acc - d_dec) / v_max
  else:  (短距离，未达v_max)
    数值求解 v_peak² - v_start²)/(2a_acc) + (v_peak² - v_end²)/(2a_dec) = d
    t_travel = (v_peak - v_start)/a_acc + (v_peak - v_end)/a_dec

简化版本（用于DRL奖励计算）:
  t_travel ≈ d / v_eff(type, load_weight)
  其中 v_eff 为考虑负载后的有效平均速度
```

### 4.2 转向时间

```
转向角度 Δθ (rad) 的完成时间:
  t_rot = |Δθ| / ω_max(type) + t_rot_settle
  
  其中 t_rot_settle = 0.3s (转向后的稳定时间)
  
  转向期间行驶距离:
    d_rot = v_rot_max(type) · t_rot

  路径中节点i到节点j的总行程时间:
    t(i→j) = t_rot(Δθ) + t_travel(dist(i,j) - d_rot, v_rot_max, v_cruise)
```

---

## 5. 约束汇总：融入MDP奖励函数

### 5.1 完整MDP约束集

```
约束类别 C₁: 容量约束
  ∀a, ∀t:  Σ load_count(a) ≤ max_load_count(type(a))
  ∀a, ∀t:  Σ load_weight(a) ≤ max_load_weight(type(a))

约束类别 C₂: 电量约束
  ∀a, ∀t:  E_remain(a, t) > E_low(type(a))
  ∀a, 行程选择需保证: E_remain - E_consumed(path) ≥ E_low

约束类别 C₃: 运动学约束
  ∀a, ∀t:  v ∈ [v_min, v_max], |a| ≤ a_max, ω ≤ ω_max
  转向时: v ≤ v_rot_max

约束类别 C₄: 碰撞避免约束
  ∀aᵢ,aⱼ (i≠j), ∀t:
    双车道条件:
      d(aᵢ, aⱼ) ≥ d_safe(vᵢ, vⱼ)        (安全间距)
      ¬head_on_conflict(aᵢ, aⱼ)           (对向冲突)
      ¬intersection_conflict(aᵢ, aⱼ, t)   (交叉口冲突)
    负载异常旋转: comb_width ≤ lane_half_width × 2

约束类别 C₅: 通道合规约束
  ∀a, ∀e:  comb_width(a) ≤ max_clearance(e)
  ∀a, ∀e:  遵守 direction(e)
```

### 5.2 融入奖励函数

```
扩展奖励函数 R:

R = -[ 
    w₁ · Σ 行驶距离ₐ                                    (基础距离)
  + w₂ · Σ 行程时间ₐ                                     (时间效率)
  + w₃ · Σ E_consumedₐ                                   (能耗成本)
  + w₄ · Σ 冲突等待时间ₐ                                  (冲突惩罚)
  + w₅ · Σ max(0, E_low - E_remain)                      (低电量惩罚)
  + w₆ · 任务完成时间(makespan)                            (整体效率)
  + w₇ · Σ 异常负载旋转次数 · I[侵占邻道]                  (异常装载风险)
]

权重设置 (归一化后):
  w₁:w₂:w₃:w₄:w₅:w₆:w₇ ≈ 1.0:0.8:0.5:2.0:5.0:0.3:3.0
  冲突惩罚、低电量、异常装载占用高权重 → 安全优先
```

---

## 6. 可行解掩码设计（融入 §4.4.3）

```
解码器每步的可行动作掩码 M 由五层过滤器构成:

Layer 1 — 容量掩码:
  M_cap[a, task] = 0 if load_count(a) == max_load_count
                    or load_weight(a) + task.weight > max_load_weight

Layer 2 — 电量掩码:
  M_energy[a, task] = 0 if E_remain(a) - E_consumed(a→task) ≤ E_low
  (充电站节点始终可行)

Layer 3 — 通道合规掩码:
  M_lane[a, task] = 0 if comb_width(a) > max_clearance(path_to_task)
                     or direction_violation(path)

Layer 4 — 碰撞避免掩码 (集中式):
  对于已分配给AGVⱼ的任务节点:
  M_collision[a, task] = 0 if 双车道对向冲突 or 交叉口同时占用

Layer 5 — 异常负载掩码:
  M_abnormal[a, task] = 0 if load_type=abnormal 
                         and comb_width > lane_half_width × 2
                         (限制该AGV仅走独占通道或等待负载恢复正常)

最终掩码: M = M_cap ∧ M_energy ∧ M_lane ∧ M_collision ∧ M_abnormal
动作概率: π(a|s) = softmax(QK^T/√d) ⊙ M
```

---

## 7. 约束参数与分布泛化的关系

不同分布 D_test 中，约束紧度通过以下参数变化体现：

| 分布 | 变化的约束参数 | 对泛化的挑战 |
|------|---------------|-------------|
| D_test2 高任务密度 | 容量约束更紧 + 碰撞概率增加 | 冲突掩码过滤率上升，可行解空间缩小 |
| D_test3 低任务密度 | 容量约束松弛 | 模型需避免"过度保守" |
| D_test4 极端AGV配比 | AGV类型分布偏移 | HeteAttn的跨类型注意力需适应新配比 |
| D_test5 不同仓库尺寸 | 通道拓扑 + 路径长度变化 | 电量约束"有效范围"改变 |
| D_test6 不同AGV数量 | 碰撞掩码维度线性增长 | 解码器需处理变长联合动作空间 |
| **新增 D_test7** | **异常负载比例** (0%→30%) | Layer 5 掩码激活频率变化 |

---

> **状态：可作为 §3 问题建模 + §4.4.3 可行掩码的素材**  
> 建议新增测试分布 D_test7（异常负载比例），增强实验覆盖面
