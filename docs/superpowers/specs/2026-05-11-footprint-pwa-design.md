# 足迹·Footprint — 实现设计文档

**日期：** 2026-05-11
**状态：** 待审批
**基于：** README.md 设计开发文档 v1.0

---

## 1. 技术选型

| 层 | 选型 | 版本 |
|----|------|------|
| 构建工具 | Vite | 6.x |
| UI 框架 | Preact | 10.x |
| 状态管理 | @preact/signals | 1.x |
| 地图 | Leaflet | 1.9+ |
| 图表 | Chart.js | 4.x |
| 本地存储 | Dexie.js | 4.x |
| 天气 | Open-Meteo API | 免费无 Key |
| 逆向地理 | Nominatim API | 免费无 Key |
| PWA | Workbox (vite-plugin-pwa) | 0.20+ |
| 截图 | html2canvas | 1.4+ |

---

## 2. 文件结构

```
footprint/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── main.jsx                 — 入口，挂载 App
│   ├── app.jsx                  — 根组件，Tab 路由
│   ├── components/
│   │   ├── TabBar.jsx           — 底部 4-Tab 导航
│   │   ├── home/
│   │   │   ├── HomePage.jsx     — 首页容器
│   │   │   ├── MapView.jsx      — Leaflet 地图封装
│   │   │   └── InfoCards.jsx    — 一主二辅信息方框
│   │   ├── records/
│   │   │   ├── RecordsPage.jsx  — 记录 Tab 容器
│   │   │   ├── Calendar.jsx     — 月视图日历
│   │   │   ├── DaySummary.jsx   — 当日运动摘要+环境
│   │   │   └── TrackDetail.jsx  — 全屏轨迹查看页
│   │   ├── analysis/
│   │   │   ├── AnalysisPage.jsx — 分析 Tab 容器
│   │   │   ├── FilterBar.jsx    — 年月周筛选栏
│   │   │   ├── StatsCards.jsx   — 4 指标横条
│   │   │   └── Charts.jsx      — 图表区域
│   │   ├── app-settings/
│   │   │   ├── AppPage.jsx      — APP Tab 容器
│   │   │   ├── ExportImport.jsx — 导入导出功能
│   │   │   └── GoalSetting.jsx  — 运动目标设置
│   │   └── share/
│   │       ├── SharePreview.jsx — 分享预览编辑界面
│   │       └── ShareCard.jsx    — 1080x1920 卡片模板
│   ├── services/
│   │   ├── tracker.js           — GPS 定位管理器
│   │   ├── stayDetector.js      — 停留检测算法
│   │   ├── weather.js           — Open-Meteo 封装
│   │   ├── nominatim.js         — 逆向地理编码+缓存
│   │   └── trackSegment.js      — 轨迹分段逻辑
│   ├── db/
│   │   ├── index.js             — Dexie 数据库定义
│   │   └── queries.js           — 常用查询封装
│   ├── store/
│   │   └── signals.js           — 全局响应式状态
│   ├── utils/
│   │   ├── geo.js               — 距离计算、坐标工具
│   │   ├── format.js            — 时间/距离格式化
│   │   └── export.js            — JSON/GPX/KML 序列化
│   └── styles/
│       └── global.css           — CSS 变量+全局样式
└── docs/
    └── superpowers/specs/       — 设计文档
```

---

## 3. 核心模块设计

### 3.1 tracker.js — GPS 定位管理器

**职责：** 管理 `navigator.geolocation.watchPosition` 生命周期，过滤无效点，写入数据库。

**接口：**
- `startTracking()` — 启动定位监听
- `stopTracking()` — 停止监听
- `getCurrentPosition()` — 获取当前位置（Promise）

**过滤规则：**
- accuracy > 100m → 丢弃
- 距上次点 < 3m → 跳过
- 坐标为 0,0 或 null → 丢弃

**配置：**
- `enableHighAccuracy: true`
- `maximumAge: 0`
- `timeout: 10000`

**写入：** 合格点写入 `trackPoints` 表，同时更新 signal `currentPosition` 和 `todayPoints`。

### 3.2 stayDetector.js — 停留检测

**职责：** 每 60 秒执行一次，检测用户是否在某地停留 ≥ 8 分钟。

**算法：**
1. 取最近连续路径点
2. 计算瞬时速度 = haversine(prev, curr) / timeDiff
3. 标记速度 < 1km/h 的连续段
4. 段时长 ≥ 480s → 候选打卡点
5. 取中位数坐标作为打卡点位置
6. 防重复：500m 内 24h 不重复标记

**输出：** 写入 `checkinPoints` 表，触发 Nominatim 解析。

### 3.3 trackSegment.js — 轨迹分段

**职责：** 检测 GPS 中断 ≥ 30 分钟，自动结束当前轨迹并开始新轨迹。

**逻辑：**
- 每次新点到达时检查与上一点的时间差
- 时间差 ≥ 30min → 结束当前轨迹（计算摘要写入 `tracks`）→ 开始新轨迹
- 冷启动时检查上次定位时间，决定是否新建轨迹

### 3.4 weather.js — 天气服务

**职责：** 调用 Open-Meteo API 获取当前天气。

**触发条件：** 每 5 分钟 或 检测到新城市时。

**API 参数：**
- current: temperature_2m, apparent_temperature, weather_code, wind_speed_10m
- daily: temperature_2m_max, temperature_2m_min, sunrise, sunset

**缓存：** 结果存入 signal，5 分钟内不重复请求。

### 3.5 nominatim.js — 逆向地理编码

**职责：** 坐标 → 地名/街道/区域。

**约束：**
- 请求间隔 ≥ 1 秒（Nominatim usage policy）
- 同一 ~1km² 范围不重复请求
- 缓存 TTL = 7 天，存入 `nominatimCache` 表

### 3.6 signals.js — 全局状态

```js
// 定位状态
currentPosition    // { lat, lng, accuracy }
isTracking         // boolean
locationDenied     // boolean

// 今日数据
todayPoints        // TrackPoint[]
todayDistance      // number (km)
todayCheckins      // CheckinPoint[]
currentTrackId     // number

// 天气
weatherData        // { temp, high, low, code, city }

// UI 状态
activeTab          // 'home' | 'records' | 'analysis' | 'app'
isFollowingMap     // boolean
```

---

## 4. 数据库 Schema

直接采用 README 第四章定义的 5 张表：
- `tracks` — 轨迹摘要
- `trackPoints` — 路径点（高频写入）
- `checkinPoints` — 打卡点
- `goals` — 运动目标（单条）
- `nominatimCache` — 地理编码缓存

Dexie 定义：
```js
db.version(1).stores({
  tracks: '++id, date, startTime, endTime',
  trackPoints: '++id, trackId, timestamp',
  checkinPoints: '++id, trackId, category',
  goals: '++id',
  nominatimCache: '++id, latKey, expiresAt'
});
```

---

## 5. UI 组件设计

### 5.1 TabBar

4 个 Tab：首页(home)、记录(records)、分析(analysis)、APP(app)。
- 固定底部，高度 50px + safe-area-inset-bottom
- 选中态：图标+文字 #FF8C42，未选中 #C4C4C4
- 切换时对应页面组件挂载/卸载

### 5.2 HomePage — 地图与交互

**MapView 配置：**
- 全屏背景（Leaflet），默认缩放级别 15，支持 12-18 级
- 首次加载以用户当前位置为中心
- 有今日轨迹时 → `fitBounds` 使轨迹完整显示（padding 50px）
- 支持缩放、拖动、双击放大

**轨迹线样式：**
- 渐变线：起点 opacity:0.4 → 终点 opacity:0.9
- 线宽 3-4px，颜色 #FF8C42
- 起点标记：空心圆点（白色边框 + #FF8C42 填充）
- 终点标记：实心圆点（白色边框 + #FF8C42 填充）

**打卡点标记：**
- 气泡针样式：细线 + 圆形气泡 + 序号数字
- 颜色按分类：景点 #FF8C42、餐饮 #FF4D6D、住宿 #2B7A78、交通 #9CA3AF、购物 #4A9EFF、其他 #8A8A8A

**图层切换：** 右上角图层按钮，切换标准 OSM / 卫星图

**地图跟随逻辑：**
- 默认跟随当前位置
- 用户拖动地图 → 跟随模式关闭 → 右上角显示"跟随"按钮
- 点击"跟随"按钮 → 地图回到当前位置并继续跟随

**InfoCards 浮在地图上方（absolute 定位）：**
- 顶栏显示 App 名称 + 今日距离
- 主框（宽 2 倍）：当前城市/区域名 + 天气图标 + 温度（当前/最高/最低）
- 辅框 1：今日行走距离(km) + 今日探索打卡点数量
- 辅框 2：当前位置街道/景点名
- 所有方框：纯白卡片 + 轻阴影（background: #FFFFFF; box-shadow: 0 2px 16px rgba(0,0,0,0.06)）
- 定位失败时主框显示"位置未授权"，不显示天气

### 5.3 RecordsPage

- Calendar 月视图（自建，非第三方库）
- 支持上/下月切换（左右滑动或箭头按钮）
- 有数据日期显示暖橙圆点标记
- 当前日期用圆框高亮（#FF8C42 边框）
- 点击日期 → 显示预览卡片（日期+星期+总距离+区域数+打卡点数）→ 点击"查看轨迹"按钮 → TrackDetail 全屏

**TrackDetail 全屏轨迹查看页：**
- 全屏地图，展示该日所有轨迹段
- 轨迹线：梯度颜色（按时间从浅到深）
- 打卡点：气泡针 + 序号，点击显示轻量卡片（名称、到达时间、备注）
- 底部固定分享按钮（暖橙色 #FF8C42，常驻）
- 右下角缩放控件
- 右上角关闭按钮返回日历

**DaySummary 方框内容：**
- 上半部分（运动摘要）：当日总距离(km)、活跃时段（如"09:30-11:45, 14:00-16:20"）、打卡点数量、经过的区域数
- 下半部分（环境上下文）：当日天气概况（最高/最低温、天气状况）、日出/日落时间、当日平均气温

### 5.4 AnalysisPage

- FilterBar：年/月/周下拉 + 确定按钮
- StatsCards：4 个指标卡片横向排列（总行程 XXX.X km、活跃天数 X 天、日均距离 X.X km、新探索 X 个）
- Charts：根据筛选范围自动切换图表类型：
  - 年 → 月度折线图（横轴 1-12 月，纵轴每月总距离）
  - 月 → 周对比柱状图（横轴 Week 1-5，纵轴每周日均距离）
  - 周 → 环形进度图（周日-周六，每日完成度）

**旅游专属统计（附加维度）：**
- 城市探索分布：环形图展示足迹覆盖的城市/区域比例
- 打卡点类型分布：饼图展示各类别打卡点的数量占比
- 出行规律图：折线图展示一周内每天的活跃模式
- 最常出行时段：柱状图展示 24 小时活跃时间段分布

**空状态：**
- 数据 < 3 天："收集更多足迹，分析更有趣"
- 当月无数据："本月还没有记录"
- 图表区灰色，不展示空白图表

### 5.5 SharePreview

- 全屏覆盖层
- 可编辑打卡点列表：
  - 点击 ✕ 按钮删除打卡点（仅从本次分享卡片移除，不影响 DB）
  - 长按拖拽调整显示顺序
  - 点击文本框为每个打卡点添加一句话备注
- "生成"按钮 → html2canvas 截图 → navigator.share（fallback 到图片下载）

**卡片规格（1080 × 1920 px，9:16 竖版）：**
- 左上角：日期 · 城市（14px 白色）
- 中部：轨迹缩略图（占 60% 高度），地图暗色调背景，轨迹线暖橙，打卡点气泡+序号
- 下部：打卡点列表（最多显示 5 个），每个一行（时间 + 地名 + 用户备注）
- 底部信息行：总距离 · 总时长
- 右下角水印：🥾 足迹 × Footprint（12px 小字）

---

## 6. PWA 配置

- `vite-plugin-pwa` 集成 Workbox
- 缓存策略：
  - 地图瓦片：CacheFirst（长期缓存）
  - API 请求（天气/Nominatim）：NetworkFirst（离线回退缓存）
  - 静态资源：CacheFirst
- manifest.json 按 README 3.3 节配置
- iOS meta tags：apple-mobile-web-app-capable, status-bar-style

---

## 7. 后台策略

按 README 3.4 节分级实现：
- Level 1：前台 watchPosition（默认）
- Level 2：AudioContext 静音音频保活（PWA 模式）
- Level 3：冷启动虚线补全（灰色虚线连接中断段）

---

## 8. 错误处理

按 README 第十一章错误状态矩阵实现：

| 场景 | 表现 | 行为 |
|------|------|------|
| GPS 信号弱 | accuracy > 100m | 丢弃低精度点；顶栏淡黄条"定位信号弱"；记录频率降至 15s/次 |
| 无网络 | 天气 API 失败 | 天气显示"离线模式"灰色占位；地图瓦片用缓存；Nominatim 跳过 |
| 存储空间满 | IndexedDB 写入失败 | 自动压缩：>30天前轨迹降采样至 1/5 密度；提示"数据较多，建议导出后清理" |
| 写入失败 | Dexie 抛异常 | 温和提示"存储异常，数据可能不完整"；引导导出后清除 |
| 无效坐标 | 0,0 或 null | 直接丢弃，不写入 |
| 定位拒绝 | 用户拒绝权限 | 首页显示"位置未授权"；不记录轨迹；不重复弹权限窗 |
| 定位恢复 | GPS 从弱到强 | 自动恢复记录频率；中断段用灰色虚线 |
| 导入冲突 | 日期已存在 | 按日期去重，不覆盖已有数据 |

**存储满自动压缩逻辑：**
1. 触发条件：可用空间 < 10MB 或写入失败
2. 查询 30 天前的轨迹
3. 对每条轨迹的 trackPoints 降采样（每 5 个点保留 1 个）
4. 更新 track 的 pointCount
5. 通知："已自动优化存储空间"
6. 压缩后仍不足 → 引导用户导出后清除

**空状态设计：**

| 页面 | 空状态显示 |
|------|------------|
| 首页（无轨迹） | 地图显示当前位置，方框正常，不显示轨迹线 |
| 记录 Tab（无数据） | 日历无标记，"尚无足迹记录"提示 |
| 分析 Tab（数据<3天） | "收集更多足迹，分析更有趣" |
| 分析 Tab（当月无数据） | "本月还没有记录" |
| APP Tab（无数据） | 正常显示，可导出空数据文件 |

---

## 9. 设计语言

**CSS 变量完整清单：**

```css
:root {
  /* 背景 */
  --bg-warm-white: #FAFAF8;
  --bg-card: #FFFFFF;

  /* 主色 */
  --color-primary: #FF8C42;       /* 足迹高亮、轨迹线、Tab选中 */
  --color-stats: #4A9EFF;         /* 统计指标主色 */

  /* 分类色 */
  --color-restaurant: #FF4D6D;    /* 餐饮 */
  --color-hotel: #2B7A78;         /* 住宿 */
  --color-transport: #9CA3AF;     /* 交通 */

  /* 文字 */
  --text-primary: #2C2C2C;
  --text-secondary: #8A8A8A;
  --text-tertiary: #B0B0B0;

  /* 边框与分割 */
  --border-color: #E5E5EA;
  --divider-color: #E8E8E8;

  /* 阴影 */
  --shadow-card: 0 2px 16px rgba(0,0,0,0.06);
  --shadow-glow: 0 0 10px rgba(255,140,66,0.25);

  /* 状态 */
  --color-warning: #FFC107;
  --color-tab-inactive: #C4C4C4;
}
```

**字体规范：**
- 字体栈：`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif`
- 大标题：20px / 700
- 标题：17px / 600
- 正文：15px / 450-500
- 辅助：12px / 400
- 大数字（统计）：28-36px / 700 / tabular-nums

**间距与圆角：**
- 卡片圆角：16px
- 按钮圆角：12px
- Tab Bar 高度：50px + env(safe-area-inset-bottom)
- 页面 Padding：左右 16px，顶部 16px + env(safe-area-inset-top)
- 卡片 Padding：12px
- 卡片间距：8px

---

## 10. Onboarding 与权限

### 10.1 零打断 Onboarding 策略

App 完全被动，无传统引导页。使用 toast / 微交互动画：

| 时机 | 引导内容 | 形式 |
|------|----------|------|
| 首次打开 | 无操作，地图自动加载定位 | 静默 |
| 首次定位成功 | 地图上小脉冲动画 + toast"足迹追踪已开始" | 2s 自动消失 |
| 首次完成轨迹 | toast"1 条轨迹已保存，可在记录 Tab 中查看" | 2s 自动消失 |
| 首次打开记录 Tab（数据<3条） | "点击日期查看当日足迹" | 灰色小字 |
| 首次打开分析 Tab（数据<3天） | "收集更多足迹，分析更有趣" | 图表占位区温和提示 |

### 10.2 定位权限处理

- 首次打开 → 浏览器原生定位权限对话框（无额外 UI）
- 用户授权 → 直接进入地图界面
- 用户拒绝 → 不重复弹窗、不弹引导、首页显示"位置未授权"、不记录轨迹
- 用户手动开启定位 → 系统通知 → 自动恢复记录

---

## 11. 性能指标

| 指标 | 目标值 |
|------|--------|
| 页面首次加载 | < 3s（3G 网络） |
| 地图渲染 | < 1s |
| 轨迹刷新延迟 | < 2s（从定位到画线） |
| 截图生成 | < 2s |
| 图表渲染 | < 500ms |
| 日历切换 | < 200ms |
| 存储占用（1 年数据） | < 50MB |

---

## 12. 兼容性

| 平台 | 支持度 | 说明 |
|------|--------|------|
| iOS Safari | 完全支持 | PWA 添加到主屏幕后体验最佳 |
| iOS Chrome | 支持 | Geolocation API 可用 |
| Android Chrome | 完全支持 | PWA + 后台定位支持更好 |
| Desktop Chrome | 支持 | 主要为移动端设计，桌面可测试 |

---

## 13. 数据导入导出细节

### 导出

- 支持格式：JSON（全量备份）、GPX（标准 GPS 交换）、KML（Google Earth）
- 流程：点击"导出数据" → 格式选择框 → Dexie 查询 → 序列化 → `navigator.share({ files })` 或 `<a download>`
- JSON：全部表数据完整备份
- GPX：每条轨迹独立一个 GPX 文件
- KML：所有轨迹在一个文件中，按日期分组

### 导入

- 支持拖入或点击选择 JSON / GPX / KML 文件
- 自动检测格式（解析文件头）
- 导入前预览：显示文件中包含的轨迹数量和日期范围
- 导入策略：按日期去重，跳过重复，不覆盖已有数据
- 导入成功后显示汇总信息

---

## 14. 地点自动分类规则

| 分类 | 关键词匹配 | 附加条件 |
|------|-----------|----------|
| attraction | 公园、博物馆、景区、古迹、广场 | — |
| restaurant | 餐厅、馆、店、咖啡、小吃 | 或时段 11:30-13:00 / 17:30-19:30 |
| hotel | 酒店、客栈、民宿、青旅 | 且停留 > 2 小时 |
| transport | 站、机场、出口、停车场 | — |
| shop | 商场、超市、商店 | — |
| other | 无法匹配以上 | 兜底分类 |

---

## 15. 实现顺序

按 README 第十三章优先级：

**Phase 1 (P0)：** 项目脚手架 → 数据库 → GPS 追踪 → 地图显示 → 轨迹绘制 → PWA 基础
**Phase 2 (P1)：** 记录 Tab 日历 → 分析 Tab 图表 → APP Tab 管理 → 打卡点识别 → 分享卡片
**Phase 3 (P2)：** 后台保活 → 冷启动补全 → 图层切换 → 错误状态 → 运动目标
