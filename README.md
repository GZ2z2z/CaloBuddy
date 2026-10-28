# CaloBuddy 🥑 - 极简智能饮食与减脂热量追踪器

<p align="center">
  <img src="./public/icons/icon-512.png" alt="CaloBuddy Logo" width="108" height="108" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(16,185,129,0.25);" />
</p>

<p align="center">
  <b>专为 iPhone / iPad 定制的个人减脂控卡 PWA 原生级应用</b><br>
  薄荷健康经典三栏看板 · 份重解耦 · 液体智能换算 · 快录大卡 · 跨设备同步 · 离线优先 · 零广告与零隐私泄露
</p>

<p align="center">
  <a href="https://gz2z2z.github.io/CaloBuddy/"><img src="https://img.shields.io/badge/Demo-在线体验-10B981?style=flat-square&logo=safari" alt="Live Demo"></a>
  <a href="https://github.com/GZ2z2z/CaloBuddy/actions"><img src="https://img.shields.io/github/actions/workflow/status/GZ2z2z/CaloBuddy/deploy.yml?branch=main&style=flat-square&label=Deploy&logo=githubactions" alt="Build Status"></a>
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/PWA-iOS%20Standalone-purple?style=flat-square&logo=pwa" alt="PWA Ready">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License">
</p>

---

## 🌐 线上快速体验

👉 **立即访问体验**：**[https://gz2z2z.github.io/CaloBuddy/](https://gz2z2z.github.io/CaloBuddy/)**

> 💡 **最佳体验建议**：使用 **iPhone / iPad Safari 浏览器** 打开上述链接，点击底部分享栏中的 **「添加到主屏幕」**，即可获得无浏览器地址栏、全屏运行的原生 App 体验！

---

## 💡 为什么选择 CaloBuddy？

市面上的大多数热量计算 App 充斥着**开屏广告、社交动态广场、繁琐的强买会员陷阱以及个人隐私上传云端**的烦恼。  
**CaloBuddy** 专为追求极致专注、科学自律的健身与减脂人群打造：

1. **零广告、零收费陷阱**：完全开源，无任何增值付费模块。
2. **纯本地隐私安全**：基于浏览器 IndexedDB（Dexie.js）存储，所有饮食与体重数据均留在你的设备中。
3. **针对 iOS 深度调优**：专门解决移动端虚拟键盘遮挡、安全区适配（Safe Area）、触摸手势回弹等交互细节。
4. **科学高效的控卡逻辑**：薄荷健康经典看板布局，份数/重量解耦，毫升/克液体自适应换算。

---

## ✨ 核心特性一览

### 1. 🥑 薄荷健康经典三栏看板
- **核心热量中枢**：采用经典的「**饮食摄入 | 环形仪表盘（还可以吃）| 运动消耗**」三栏布局，直观展现每日能量缺口。
- **三大供能宏量营养素**：实时展示碳水化合物、蛋白质、脂肪的已摄入克数、目标克数以及剩余可摄入额度，并辅以色彩鲜明的进度条。
- **饮食健康评分**：基于三大营养素供能比与热量预算，实时智能打分（优质/平衡/偏高提示），提供阶段性饮食优化建议。

### 2. ⚡ 「快录大卡」一键速记
- **外食 / 聚餐免搜索录入**：聚餐、点外卖或吃已知热量包装食品时，点击浮动胶囊中的 **「⚡ 快录大卡」**，直接录入总卡路里与宏量营养素。
- **AI / 科学配比一键推算**：只知道摄入的大卡？点击「按平衡比例推算」，系统自动根据 50% 碳水 / 25% 蛋白质 / 25% 脂肪科学折算对应克数。
- **微量元素支持**：同时支持输入或微调**膳食纤维（g）**与**钠含量（mg）**。

### 3. ⚖️ 份数与总重解耦显示
- **告别模糊算账**：传统 App 常混淆“一个”与“多少克”。CaloBuddy 清晰区分单份规格与总重：  
  > 例：`鸡蛋 60g/个 × 2个 (总重 120g) · P15.6 C3.4 F10.6`
- **极简调节**：在餐品详情卡片与录入面板中均支持 `[-] 2 [+]` 步进器快速增减，实时计算总营养素。

### 4. 🥛 液体单位（ml / g）智能换算
- **毫升与克智能切换**：记录牛奶、豆浆、无糖饮料、汤品时，支持在 `毫升 (ml)` 与 `克 (g)` 之间一键切换。
- **内置食品密度自适应**：牛奶等液体食材默认按照实际比重（约 1.03g/ml）精准折算热量，无需手动换算。

### 5. 🔍 全屏沉浸式食物搜索与创建（iOS 键盘防遮挡）
- **顶置置顶搜索栏**：针对 iOS Safari 虚拟键盘弹起遮挡问题，采用 `z-[100]` 全屏模态架构，输入框恒定顶置，搜索列表流畅滚动。
- **权威数据库**：内置 100+ 常见权威减脂食物（权威中国食物成分表 + USDA），涵盖全谷物、瘦肉海鲜、蔬果奶类、坚果油脂等。
- **拼音简拼 & 分类检索**：支持汉字及拼音首字母缩写检索（如输入 `jdr` 匹配「鸡蛋」），支持按分类标签快速筛选。
- **自定义私房食物**：找不到冷门食材？点击底部的「+ 自定义添加新食物」，一秒录入属于自己的食物库，永久离线保存。

### 6. 🎯 营养目标与单餐数据全面自定义
- **每日摄入目标自定义**：在「设置」中可任意定制目标体重、每日推荐总大卡、碳水/蛋白质/脂肪目标摄入量。
- **一键还原科学公式**：基于国际标准的 **Mifflin-St Jeor 基础代谢公式** 与 **TDEE 减脂能量赤字（推荐 -500 kcal）**，一键快速重置回标准值。
- **已记录餐品微调**：点击今日餐单中的任一记录，随时微调热量数值与三大营养素。

### 7. 🔄 iPhone & iPad 跨设备双轨同步
CaloBuddy 支持两种跨设备数据同步方案，无论是否有开发背景都能轻松使用：

| 同步方式 | 适合场景 | 操作便捷度 | 隐私与网络说明 |
| :--- | :--- | :---: | :--- |
| **方案 A：AirDrop 隔空投送** | iPhone 与 iPad 面对面同步 | ⭐️⭐️⭐️⭐️⭐️ (1秒完成) | 纯本地蓝牙/Wi-Fi，零网络中转，免配置任何 Token |
| **方案 B：GitHub Gist 私密云同步** | 异地双设备云端一键同步 | ⭐️⭐️⭐️⭐️ (一次配置) | 托管于个人私有 Gist，零第三方服务器中转，安全可控 |

---

## 📲 iPhone / iPad 部署到主屏幕指南

借助 iOS / iPadOS 原生 PWA 技术，你无需越狱、无需付费申请苹果开发者证书（\$99/年），即可获得全屏原生体验：

```
1. 打开 Safari 浏览器 ➔ 访问部署网址（https://gz2z2z.github.io/CaloBuddy/）
2. 点击 Safari 底部中央的「分享按钮」（带有向上箭头的正方形方框）
3. 在弹出的操作面板中向上滑动，找到并轻点「添加到主屏幕 (Add to Home Screen)」
4. 点击右上角「添加」进行确认
5. 返回设备桌面，轻点「CaloBuddy」图标启动，即可享受丝滑全屏体验！
```

---

## 🔄 iPhone 与 iPad 数据互通教学

### 方案 A：隔空投送（AirDrop）极简互传（推荐）
1. 在 **设备 1（如 iPhone）** 打开 CaloBuddy ➔ 进入右下角 **「设置」** 页面。
2. 找到「数据备份与跨设备同步」模块，点击 **「📤 导出备份数据 (JSON)」**，系统会自动生成并调出分享弹窗。
3. 在系统分享菜单中选择 **「隔空投送 (AirDrop)」**，发送到你的 **设备 2（如 iPad）**。
4. 在 **设备 2** 接收该文件后保存到「文件」App 中。
5. 在 **设备 2** 的 CaloBuddy「设置」页面点击 **「📥 导入备份数据」**，选择刚才接收的 JSON 文件，即可秒级恢复完整数据！

### 方案 B：GitHub Gist 私密云端同步（异地自动云同步）
1. **获取 Personal Access Token**：  
   登录 GitHub，进入 [Tokens 设置](https://github.com/settings/tokens)，生成一个勾选了 **`gist`** 权限的 Token。
2. **在 iPhone 上开启同步**：  
   在「设置 ➔ GitHub Gist 私密云同步」中填入 Token，点击 **「上传到云端」**，系统会自动创建私密 Gist 并生成 Gist ID。
3. **在 iPad 上拉取同步**：  
   将生成的 Token 和 Gist ID 填入 iPad 的 CaloBuddy 设置中，点击 **「从云端拉取」**，即可无缝同步所有数据！

---

## 🚀 GitHub Pages 自动化部署说明

CaloBuddy 已配置了 GitHub Actions 自动化持续集成与部署工作流（`.github/workflows/deploy.yml`）。  
只需将代码推送到你的 GitHub 仓库的 `main` 分支，就会自动执行 TypeScript 校验、Vite 生产打包并发布到 GitHub Pages。

### 首次部署开启步骤：
1. 访问你的 GitHub 仓库设置：`https://github.com/<你的用户名>/CaloBuddy/settings/pages`
2. 在 **Build and deployment** 下方的 **Source** 选项中，选中：  
   👉 **`GitHub Actions`** （切勿选择 "Deploy from a branch"）
3. 保存后，进入仓库的 [Actions 页面](https://github.com/GZ2z2z/CaloBuddy/actions)，点击最近的工作流或手动点击 **Run workflow**。
4. 部署完成后，即可在 `https://<你的用户名>.github.io/CaloBuddy/` 永久免费访问！

---

## 🛠️ 本地开发与构建

如果你想在本地调试代码或二次开发：

```bash
# 1. 克隆代码仓库
git clone https://github.com/GZ2z2z/CaloBuddy.git
cd CaloBuddy

# 2. 安装项目依赖
npm install

# 3. 启动本地开发服务器（支持 HMR 热重载）
npm run dev

# 4. 执行生产环境静态资源构建
npm run build

# 5. 本地预览生产环境产物
npm run preview
```

---

## 🧱 技术架构与技术选型

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端核心** | React 19 + TypeScript 5.7 | 现代化并发特性，严格的静态类型推导 |
| **构建工具** | Vite 6 + vite-plugin-pwa | 秒级启动与热更新，离线 Service Worker 自动生成与更新 |
| **样式与动效** | Tailwind CSS + Framer Motion | 移动端沉浸式动效、触控阻尼反馈与微交互 |
| **本地数据库** | Dexie.js (IndexedDB) | 纯前端离线持久化存储，无需服务端即可保证大容量高效读写 |
| **模糊匹配** | Fuse.js + pinyin-pro | 食物数据库毫秒级中文全拼与拼音首字母混合检索 |
| **数据可视化** | Recharts | 优雅的摄入量与体重趋势折线/柱状图表 |
| **通知反馈** | react-hot-toast + canvas-confetti | 达到每日健康目标时的庆祝特效与操作轻提示 |

---

## 🔒 隐私与数据安全

- **100% 离线优先**：所有数据均默认保存在本地浏览器沙箱存储（IndexedDB），绝不主动向任何第三方服务器上传你的生理与饮食隐私。
- **自主掌控权**：支持随时随地完整导出 JSON 明文备份，支持一键清空全部数据。

---

## 📄 开源许可证

本项目基于 [MIT License](./LICENSE) 协议开源。欢迎自由 Fork、学习交流或提出 Issue / Pull Request！
