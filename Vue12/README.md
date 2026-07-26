# 新能源汽车销量数据分析系统

基于 **Vue 3 + ECharts + Express + SQLite** 构建的新能源汽车销量数据分析与可视化平台，融合机器学习训练监控与销量预测能力，面向数据大屏展示、业务运营分析与系统管理场景。

---

## 一、项目简介

本系统围绕“新能源车销量”主题，完成从数据采集存储、权限登录、多维可视化，到机器学习参数调试与预测的完整链路：

- **数据层**：使用 SQLite 本地库持久化用户、销量、实验结果、系统配置等数据；内置更贴近真实市场的 34 省 / 地市销量种子数据。
- **服务层**：Express 提供 REST API 与训练过程 SSE 推流，支持 JWT 鉴权与角色权限控制。
- **展示层**：Vue3 大屏 + Element Plus 管理页，登录页仿拼多多风格；支持主题样式自定义。
- **智能层**：可实时监控训练指标，动态调整学习率与批次大小；支持手动调参预测与 Excel/CSV 上传预测。

适用场景包括：可视化课程设计/毕业设计演示、新能源销量运营看板、机器学习参数实验演示等。

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 + Vite 5 | Composition API、模块化路由 |
| 状态管理 | Pinia | 用户登录态、主题样式 |
| 路由 | Vue Router 4 | 登录守卫、角色路由限制 |
| UI 组件 | Element Plus | 表格、表单、上传、分页等 |
| 图表 | ECharts 6 + ECharts-GL | 2D/3D 可视化大屏 |
| HTTP | Axios | 统一拦截器、Token 注入 |
| 表格处理 | SheetJS (xlsx) + file-saver | 导入导出 Excel |
| 后端 | Express 5 | REST API / SSE |
| 数据库 | better-sqlite3 | 本地 SQLite（`server/data/nev.db`） |
| 鉴权 | JWT + bcryptjs | Token 登录、密码哈希 |
| 上传 | Multer | 预测文件上传 |

**运行环境建议**

- Node.js：`v20.x`（推荐 20.15+）
- 包管理：npm
- 浏览器：Chrome / Edge 最新版

---

## 三、功能详解

### 3.1 登录与权限

- 仿拼多多风格登录页：红白主色、圆角按钮、账号/手机号双模式切换
- 支持用户名登录、手机号登录
- 演示弹窗可点击遮罩或右上角关闭
- 角色体系：

| 角色 | 说明 | 主要权限 |
|------|------|----------|
| admin（管理员） | 系统最高权限 | 全部大屏、训练预测、用户管理、数据管理、数据库设置、主题样式 |
| analyst（分析师） | 业务分析人员 | 大屏查看、训练预测、销量数据增删改查/导入导出 |
| viewer（访客） | 只读用户 | 大屏查看（无写操作） |

### 3.2 四页可视化大屏

#### 第 1 页：全国地图大屏 `/screen/map`

- 中国地图销量热力分布
- KPI：累计销量、金额、品牌数、省份数
- 侧边：品牌销量柱状图、动力类型饼图
- **点击省份**可进入对应省级二级大屏

#### 第 2 页：销量趋势大屏 `/screen/charts2`

- 渐变堆叠面积图
- 带背景色的柱状图
- 柱状图标签旋转
- 嵌套环形图

#### 第 3 页：结构分析大屏 `/screen/charts3`

- 饼图纹理
- 单轴散点图
- AQI 雷达图（区域综合指数）
- 桑基图（节点自定义样式）
- 桑基图（渐变色边：区域→品牌→动力类型）
- 漏斗图

#### 第 4 页：效能监控大屏 `/screen/charts4`

- 带标签数字动画仪表盘
- 阶段速度仪表盘
- 打卡统计柱状图
- 三维散点图（ECharts-GL）

### 3.3 省级二级地图大屏 `/screen/region/:province`

- 中心展示该省行政区划地图（地市/区销量着色）
- 左右侧展示品牌结构、动力类型、月度趋势、热销车型
- 底部 **城市销量 TOP** 展示该省全部城市，可滚动，点击可高亮地图区域
- 从全国地图点选省份自动跳转

### 3.4 机器学习模块

#### 训练监控 `/ml/training`

- 配置实验名称、学习率、批次大小、训练轮数
- 启动后通过 **SSE** 实时推送 loss / val_loss / accuracy 等指标
- 训练过程中可动态调整学习率与批次大小
- 支持停止训练与历史实验列表查看

#### 销量预测 `/ml/predict`

- **手动调参**：选择省份/品牌/年月，调节学习率、批次、轮数、平滑系数后预测
- **上传文件**：上传 Excel/CSV 销量序列进行预测
- 展示预测值、置信度、拟合曲线与历史预测记录

### 3.5 系统管理

| 页面 | 路径 | 功能 |
|------|------|------|
| 用户管理 | `/admin/users` | 用户增删改查、角色/状态设置、手机号维护 |
| 数据管理 | `/admin/data` | 销量 CRUD、Excel 导入导出、条件筛选分页 |
| 数据库设置 | `/admin/db` | SQLite/其他库连接配置、测试连接、启用切换 |
| 系统样式 | `/admin/theme` | 背景、字体、主色/强调色、渐变、预设主题，实时预览并保存 |

---

## 四、目录结构

```text
Vue12/
├── index.html                 # 前端入口 HTML
├── package.json               # 前端依赖与脚本
├── vite.config.js             # Vite 配置（别名、代理）
├── README.md                  # 项目说明（本文件）
├── src/
│   ├── main.js                # 应用启动
│   ├── App.vue
│   ├── api/                   # 接口封装
│   ├── components/            # 通用组件（如 AppModal）
│   ├── composables/           # 组合式函数（useChart）
│   ├── layouts/               # 主布局
│   ├── router/                # 路由与守卫
│   ├── stores/                # Pinia：user / theme
│   ├── styles/                # 全局样式与 CSS 变量
│   └── views/
│       ├── Login.vue          # 登录页
│       ├── screen/            # 大屏页面（地图/趋势/结构/效能/省级）
│       ├── ml/                # 训练监控、销量预测
│       └── admin/             # 用户/数据/数据库/主题
└── server/
    ├── index.js               # Express 入口
    ├── db.js                  # SQLite 初始化与种子数据
    ├── package.json
    ├── data/
    │   ├── nev.db             # SQLite 数据库文件（运行后生成）
    │   └── provinceMeta.js    # 省市区权重与品牌车型元数据
    ├── middleware/auth.js     # JWT 鉴权
    ├── routes/                # auth / users / sales / ml / settings
    └── uploads/               # 上传文件目录
```

---

## 五、数据说明

### 5.1 核心数据表

| 表名 | 说明 |
|------|------|
| `users` | 用户账号、手机号、角色、状态 |
| `sales` | 销量明细（省/市/品牌/车型/动力类型/年月/销量/金额） |
| `ml_experiments` | 训练实验参数与状态、指标快照 |
| `ml_predictions` | 预测结果与参数记录 |
| `system_settings` | 主题样式、种子版本等配置 |
| `db_config` | 数据库连接配置 |

### 5.2 种子数据特点

- 覆盖全国 34 个省级行政区，并细化到地市/区（约 450+ 城市节点）
- 以广东月销量量级为锚，按省份权重缩放，贴近近年新能源区域格局
- 品牌份额参考比亚迪、特斯拉、理想、问界、埃安等主流格局
- 含区域品牌偏好（如广东偏埃安、浙江偏极氪、重庆偏深蓝等）
- 含季节因子（金九银十、年底冲量等）
- 通过 `sales_seed_version` 控制版本，升级后自动重灌

### 5.3 导入导出字段建议

Excel 导入时建议包含以下列（名称可兼容）：

`province, city, brand, model, vehicle_type, sales_count, amount, year, month`

---

## 六、接口概览

基础前缀：`http://localhost:3001/api`

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | `/auth/login` | 账号或手机号登录 |
| 认证 | GET | `/auth/me` | 当前用户信息 |
| 用户 | CRUD | `/users` | 用户管理（管理员） |
| 销量 | GET/POST/PUT/DELETE | `/sales` | 销量增删改查 |
| 统计 | GET | `/sales/stats/*` | 总览、分省、分品牌、趋势、省级详情等 |
| 元数据 | GET | `/sales/meta/province/:name` | 省份 adcode / 城市列表 |
| 导入导出 | POST/GET | `/sales/import` `/sales/export` | Excel 导入导出 |
| 训练 | POST | `/ml/train/start` | 启动训练 |
| 训练 | GET | `/ml/train/:id/stream` | SSE 实时指标 |
| 训练 | POST | `/ml/train/:id/params` | 动态调参 |
| 预测 | POST | `/ml/predict` `/ml/predict/upload` | 手动/上传预测 |
| 设置 | GET/PUT | `/settings/theme` | 主题读写 |
| 设置 | CRUD | `/settings/db-config` | 数据库连接配置 |

前端开发时通过 Vite 代理将 `/api` 转发到 `3001`，无需额外跨域配置。

---

## 七、快速启动

### 7.1 安装依赖

```bash
# 前端
npm install

# 后端
cd server
npm install
cd ..
```

### 7.2 启动后端

```bash
cd server
npm run dev
```

成功后可见：

```text
NEV ML API server running at http://localhost:3001
```

首次启动或种子版本升级时，会自动初始化/重灌销量数据（耗时取决于机器性能）。

### 7.3 启动前端

新开终端，在项目根目录执行：

```bash
npm run dev
```

默认地址：

- 前端：http://localhost:5173/
- 后端：http://localhost:3001/

### 7.4 生产构建（可选）

```bash
npm run build
npm run preview
```

后端生产启动：

```bash
cd server
npm start
```

---

## 八、演示账号

| 角色 | 用户名 | 密码 | 手机号 |
|------|--------|------|--------|
| 管理员 | `admin` | `admin123` | `13800138000` |
| 分析师 | `analyst` | `123456` | `13900139000` |
| 访客 | `viewer` | `123456` | `13700137000` |

登录页提供一键填充演示账号按钮，可快速体验。

---

## 九、页面路由一览

| 路由 | 页面 |
|------|------|
| `/login` | 登录 |
| `/screen/map` | 全国地图大屏 |
| `/screen/charts2` | 趋势分析大屏 |
| `/screen/charts3` | 结构分析大屏 |
| `/screen/charts4` | 效能监控大屏 |
| `/screen/region/:province` | 省级二级地图大屏 |
| `/ml/training` | 训练监控 |
| `/ml/predict` | 销量预测 |
| `/admin/users` | 用户管理 |
| `/admin/data` | 数据管理 |
| `/admin/db` | 数据库设置 |
| `/admin/theme` | 系统样式 |

---

## 十、使用指引（建议体验路径）

1. 使用 `admin / admin123` 登录  
2. 进入「全国地图」查看总体热力，点击某一省份进入省级大屏  
3. 切换「趋势 / 结构 / 效能」查看不同类型图表  
4. 打开「训练监控」启动一次训练，拖动学习率/批次观察曲线变化  
5. 打开「销量预测」分别体验手动调参与文件上传  
6. 在「数据管理」中筛选、新增、导出销量数据  
7. 在「系统样式」中切换预设主题，观察大屏配色即时变化  

---

## 十一、常见问题

### 1）前端启动报 Vite / rolldown 原生绑定错误

本项目已固定使用 **Vite 5**。若仍异常，可删除依赖后重装：

```bash
rm -rf node_modules package-lock.json
npm install
```

Windows PowerShell：

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### 2）地图不显示

省级/全国地图依赖阿里云 DataV GeoJSON 在线资源，请确保网络可访问：

`https://geo.datav.aliyun.com/areas_v3/bound/...`

### 3）后端端口被占用

默认端口 `3001`。可先结束占用进程，或修改 `server/index.js` 中的 `PORT`。

### 4）权限不足 / 401

Token 过期或未登录时会跳转登录页。重新登录即可；部分写接口仅管理员/分析师可访问。

### 5）需要重新灌入演示数据

删除或修改 `system_settings` 中的 `sales_seed_version`，重启后端即可按新版本重灌（会清空 `sales` 表后重建）。

---

## 十二、设计说明

- **大屏风格**：深色科技风，CSS 变量驱动主题（主色/强调色/背景渐变/字体）
- **登录风格**：拼多多式红白简洁商业风，与大屏形成前台入口差异化
- **弹窗交互**：通用 `AppModal` 支持点击遮罩关闭
- **图表封装**：`useChart` 统一初始化、自适应 resize 与销毁，避免内存泄漏

---

## 十三、后续可扩展方向

- 接入真实车企/行业协会销量 API
- 将演示型训练替换为真实模型训练服务（Python FastAPI / TorchServe 等）
- 增加城市下钻到区县三级大屏
- 增加报表定时导出、邮件订阅
- Docker 一键部署（前端 Nginx + 后端 Node + 数据卷）

---

## 十四、许可证

本项目用于学习与演示。如用于商业场景，请自行评估数据合规与依赖协议。
