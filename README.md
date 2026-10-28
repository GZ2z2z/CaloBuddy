# CaloBuddy 🥑 - 极简智能饮食与减脂热量追踪器

> 专为 iPhone / iPad 定制的个人减脂热量计算 PWA 应用，支持暗色/浅色双模、权威食物数据库、拍照识别营养成分表及 GitHub Pages 免费自动化部署。

🌐 **线上访问地址**：[https://gz2z2z.github.io/CaloBuddy/](https://gz2z2z.github.io/CaloBuddy/)

详细设计规划请查阅：[DESIGN.md](./DESIGN.md)

---

## 📱 核心特性

- 📱 **iOS/iPadOS 纯原生体验**：通过 Safari「添加到主屏幕」即可全屏运行，永久有效，不需签名，绝不过期。
- 🔬 **权威双轨食物库**：结合美国农业部（USDA FoodData Central）与中国疾控中心营养所《中国食物成分表》，离线毫秒级搜索。
- 📷 **拍照识表**：拍摄食品包装背面的营养成分表，智能提取大卡、蛋白质、脂肪、碳水并自动换算。
- 🤖 **AI 智能算热量**：自然语言输入（如「2个水煮蛋+1盒牛奶」）自动匹配食材并折算营养素。
- 💧 **饮水追踪与运动记录**：动态计算能量缺口与今日饮食健康得分。
- 🎨 **极简高级美学**：精心调校的浅色（Light Luxury）与暗色（OLED Obsidian）双主题。
- 🔒 **纯本地隐私存储**：所有饮食记录保存在设备本地 IndexedDB，无泄漏风险，可一键导入/导出 JSON。

---

## 🚀 GitHub Pages 部署与启用说明

本项目已配置 GitHub Actions 自动化构建脚本（`.github/workflows/deploy.yml`）。每次推送至 `main` 分支都会自动构建并发布。

首次使用需要在 GitHub 仓库中开启 Pages 托管：

1. 打开仓库设置页面：[https://github.com/GZ2z2z/CaloBuddy/settings/pages](https://github.com/GZ2z2z/CaloBuddy/settings/pages)
2. 在 **Build and deployment** 下方的 **Source** 中，将选项切换为：
   👉 **`GitHub Actions`** （注意：不是 Deploy from a branch）
3. 保存后，进入仓库的 [Actions 页面](https://github.com/GZ2z2z/CaloBuddy/actions)，点击最近一次 `Deploy to GitHub Pages` 运行（或等待自动触发）。
4. 部署完成后即可通过网址访问：  
   👉 **[https://gz2z2z.github.io/CaloBuddy/](https://gz2z2z.github.io/CaloBuddy/)**

---

## 📲 iPhone / iPad 添加到主屏幕全屏运行

1. 在 iPhone / iPad 上使用系统自带 **Safari 浏览器** 打开你的专属地址：  
   `https://gz2z2z.github.io/CaloBuddy/`
2. 点击 Safari 底部中央的 **分享按钮**（带向上箭头的方框图标）。
3. 向下滑动找到并点击 **「添加到主屏幕 (Add to Home Screen)」**。
4. 点击右上角 **「添加」** 确认。
5. 从手机桌面点击图标打开，即可享受 **全屏无浏览器边框的原生 App 体验**！

---

## 🛠️ 本地开发与构建

```bash
# 启动本地开发热重载服务器
npm run dev

# 执行 TypeScript 类型检查与正式生产构建
npm run build
```
