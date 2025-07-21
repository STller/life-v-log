# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 命令

### 开发环境
- `npm run dev` - 启动 Vite 开发服务器，支持热重载，访问地址：http://localhost:5173/life-v-log/
- `npm run build` - 构建生产版本（输出到 `dist/` 目录）
- `npm run lint` - 运行 ESLint 代码检查
- `npm run preview` - 本地预览生产构建版本
- `npm run deploy` - 构建并使用 gh-pages 部署到 GitHub Pages

### 代码质量检查
- `npm run lint` - 检查代码质量并自动修复可修复的问题

## 架构概览

### 核心功能
这是一个个人时间线应用，用于记录和展示生活回忆的时间顺序。应用以交替的左右布局显示时间线条目，包含图片、标签和不同的条目类型。

### 数据结构
所有时间线数据集中存储在 `src/data/timelineData.js` 中。每个时间线条目遵循以下结构：
```javascript
{
  id: number,           // 唯一标识符
  date: "YYYY-MM-DD",   // ISO 日期字符串
  title: string,        // 条目标题，支持表情符号
  description: string,  // 详细描述
  images: string[],     // 图片路径数组（包含 /life-v-log/ 前缀）
  tags: string[],       // 分类标签数组
  type: string          // "milestone" | "special" | "travel" | "daily"
}
```

### 组件层次结构
- **App.jsx**: 带路由的根组件，渲染 Timeline 或 AdminPanel
- **Timeline.jsx**: 主容器组件，获取数据，按日期排序（最新在前），渲染 TimelineItems
- **TimelineItem.jsx**: 单个时间线条目，具有交替左右定位、日期格式化、类型图标和图片处理功能
- **AdminPanel.jsx**: 时间线数据的 CRUD 操作管理界面
- **TimelineEditor.jsx**: 创建/编辑时间线条目的模态表单
- **TokenSettings.jsx**: GitHub API token 管理的配置界面
- **ImageUploader.jsx**: 上传图片到 GitHub 仓库的组件

### 关键技术模式

#### Vite 配置
- 基础路径设置为 `/life-v-log/` 用于 GitHub Pages 部署
- 所有图片引用必须在生产环境中包含此前缀

#### 时间线条目定位
- 使用基于索引的交替布局（偶数索引 = 左，奇数索引 = 右）
- 移动端视图折叠为单列布局，标记左对齐

#### 类型系统和图标
时间线条目使用四种类型，对应的表情符号图标：
- `milestone`: 🏆 (重大生活事件)
- `special`: 💕 (浪漫/特殊场合)
- `travel`: ✈️ (旅行和旅游体验)
- `daily`: 📝 (日常时刻)

#### 图片处理
- 图片存储在 `public/images/` 目录
- 路径必须包含 `/life-v-log/` 前缀用于部署
- 加载错误时自动隐藏，使用 `onError` 处理器
- 多图片网格布局，响应式尺寸调整

#### 响应式设计
- 桌面端：带中央垂直线的交替左右时间线布局
- 移动端：带左对齐标记和卡片的单列布局
- 在 768px 处使用 CSS 媒体查询断点

### 样式架构
- 组件级 CSS 文件与 JSX 文件共存
- `App.css` 中的全局样式用于重置和排版
- 配色方案：粉色渐变主题 (#ff6b9d 到 #c44569)
- 中文字体栈，带系统字体回退

### API 工具

#### GitHub API 集成 (`src/utils/githubApi.js`)
- **TokenManager**: 使用 base64 编码的安全 token 存储
- **文件操作**: 读取、更新、提交时间线数据到仓库
- **冲突检测**: SHA 比较防止数据覆盖
- **验证**: Token 权限和范围验证

#### GitHub 图片 API (`src/utils/githubImageApi.js`)
- **图片上传**: 单张和批量图片上传到仓库
- **文件管理**: 通过 GitHub API 创建、更新、删除图片
- **URL 生成**: 带部署前缀的自动路径生成
- **权限检查**: 仓库访问和推送权限验证

#### 本地数据管理 (`src/utils/localDataManager.js`)
- **自动保存**: 带防抖保存的实时本地存储
- **导出/导入**: JSON 备份和恢复功能
- **数据验证**: 时间线条目结构验证
- **冲突解决**: 本地与远程数据比较

#### 图片处理 (`src/utils/imageUtils.js`)
- **文件验证**: 格式、大小和尺寸检查
- **Base64 转换**: 用于 API 上传的客户端图片编码
- **预览生成**: 缩略图和预览 URL 创建
- **压缩**: 上传前可选的图片优化

### 部署
- GitHub Actions 工作流 (`.github/workflows/deploy.yml`) 在推送到 main 分支时自动构建和部署
- 使用 `peaceiris/actions-gh-pages@v3` 操作
- 构建到 `dist/` 目录并发布到 GitHub Pages
- 管理面板更改通过同步功能触发自动部署

### 管理员面板系统

#### 身份验证
- 基于简单密码的身份验证（可通过 `REACT_APP_ADMIN_PASSWORD` 配置）
- 默认密码: `admin123`
- localStorage 中的会话持久化
- 访问路由: `/admin`

#### 数据管理
- **本地存储**: 使用 `LocalDataManager` 工具自动保存
- **自动保存**: 带视觉反馈的实时本地持久化
- **数据导出/导入**: JSON 格式的备份和恢复
- **GitHub 同步**: 与仓库的双向同步

#### GitHub 集成
- **Token 管理**: 使用 base64 编码的安全 token 存储
- **冲突检测**: 同步前基于 SHA 的更改检测
- **自动更新**: 提交触发 GitHub Actions 部署
- **权限验证**: Token 范围和仓库访问验证

#### 图片上传系统
- **本地上传**: 带预览的直接文件上传
- **GitHub 存储**: 通过 GitHub API 上传图片到 `public/images/`
- **批处理**: 带进度跟踪的多图片上传
- **格式支持**: JPG、PNG、GIF、WebP 带大小验证
- **URL 生成**: 带 `/life-v-log/` 前缀的自动路径生成

#### 时间线编辑器功能
- **富文本支持**: 带格式的多行描述
- **标签系统**: 带现有标签建议的动态标签管理
- **日期选择器**: 日期选择的日历界面
- **类型选择**: milestone/special/travel/daily 分类的下拉菜单
- **图片管理**: 上传、预览和删除功能
- **验证**: 带错误反馈的客户端表单验证

## 开发注意事项

### 添加新的时间线条目

#### 通过管理面板（推荐）
1. 访问 `/admin` 路由并验证身份
2. 点击 "➕ 添加新记录" 按钮
3. 填写时间线编辑器表单：
   - 日期（YYYY-MM-DD 格式）
   - 支持表情符号的标题
   - 多行描述
   - 通过拖放或文件选择器上传图片
   - 添加标签（逗号分隔或从建议中选择）
   - 选择条目类型（milestone/special/travel/daily）
4. 本地保存，准备好后同步到 GitHub

#### 手动代码更新
1. 在 `src/data/timelineData.js` 的 `timelineData` 数组中添加新条目对象
2. 包含正确的日期格式（YYYY-MM-DD）
3. 使用带 `/life-v-log/` 前缀的正确图片路径
4. 选择适当的类型以正确显示图标

### 图片管理

#### 通过管理面板（推荐）
- 在时间线编辑器中使用集成的图片上传器
- 拖放或点击选择文件
- 自动上传到 GitHub 仓库
- 实时预览和进度跟踪
- 带正确前缀的自动路径生成

#### 手动管理
- 将图片放在 `public/images/` 目录
- 使用完整路径引用: `/life-v-log/images/filename.ext`
- 支持格式: JPG、PNG、SVG、WebP
- 考虑移动设备的响应式尺寸

### GitHub Token 设置
1. 在 GitHub Settings > Developer settings > Personal access tokens 生成个人访问 token
2. 需要的权限范围: `repo`（完整仓库访问权限）
3. 通过管理面板 Token Settings（🔑 Token 按钮）设置 token
4. Token 经过加密后存储在 localStorage
5. 同步操作前验证权限

### 本地化
- 日期格式使用中文区域设置 (`zh-CN`)
- UI 文本为中文
- 全面支持表情符号以增强视觉效果