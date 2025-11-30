# Startup Idea Graph MVP

> 🚀 用一句话点燃你的创业蓝图，让 AI 帮你把想法拆成可落地的项目框架。  
> 输入 → 生成 → 编辑 → 展开，四步完成从灵感到路线图的可视化跃迁。

一个可视化架构图工具，输入核心想法后自动生成围绕“项目框架”展开的卡片树，支持编辑任意卡片并刷新其下文，所有卡片可折叠/展开、拖拽，并采用自上而下分层布局避免重叠。

## 核心能力
1. 输入 `core-idea` → 仅生成“项目框架”节点（标题+正文短文）
2. 在“项目框架”下自动生成：开发计划、视觉风格、开发难点、外部资源清单、商业模式等子节点（均含标题+正文）
3. 双击节点打开编辑面板，保存后自动替换旧子树并重新生成下文
4. 单击节点展开/折叠正文；折叠显示摘要，展开动态增高卡片
5. 分层自上而下布局，同层横向均匀分布，连线始终连接卡片中心，避免重叠
6. 导出当前架构图为 Markdown 文件，包含所有节点信息（标题+正文）

## 技术栈
- 后端：Python 3.13 + Flask + OpenAI 兼容 API（Moonshot Kimi）
- 前端：原生 JavaScript + D3.js v7
- 环境/依赖：uv 包管理器，自动创建 `.venv`

## 快速开始
```powershell
# 1. 克隆或进入项目目录
cd d:\BaiduSyncdisk\项目库\new_work

# 2. 初始化虚拟环境并安装依赖
uv init
uv add flask openai python-dotenv pytest

# 3. 配置 API 密钥（Windows PowerShell）
$env:LLM_API_KEY="你的密钥"

# 4. 启动服务
uv run python app.py

# 5. 打开浏览器访问
http://localhost:5000
```

## 使用说明
1. 在顶部输入框填写 startup 核心想法，点击“项目启动”
2. 页面生成“项目框架”卡片，并自动展开其下一层（开发计划/视觉风格/...）
3. 双击任意卡片 → 编辑面板 → 修改正文 → 保存更新（旧子树被删除并重生）
4. 单击卡片 → 折叠/展开正文；卡片高度随内容自动变化
5. 拖拽卡片可手动调整位置（布局仅初始化时计算，后续拖拽自由）

## API 端点
- `GET /api/health` 检查密钥与 LLM 可用性
- `POST /api/analyze_idea` 输入 `{content:string}` 返回 `{success, nodes:[{id,name,description,type,depth,expanded,content,collapsed},...], stop}`
- `POST /api/expand_node` 输入 `{content,type,depth}` 返回同上结构

## 项目结构
```
.
├── app.py              # Flask 服务与 LLM 调用
├── templates/
│   └── index.html      # 页面骨架
├── static/
│   ├── main.js         # D3 渲染、交互、布局
│   └── styles.css      # 基础样式
├── tests/
│   └── test_api.py     # pytest 用例（带 mock）
└── README.md
```

## 开发提示
- 所有 LLM 提示词要求返回严格 JSON，含 `nodes` 数组与可选 `stop` 布尔值
- 节点数据结构统一包含：`id, name, description, type, depth, expanded, content, collapsed`
- 前端布局采用分层自上而下算法，同层横向均匀分布，层间距动态计算
- 文本分行按卡片宽度（280px）与近似字符宽（7px）计算，防止溢出

## 测试
```powershell
uv run python -m pytest -q
```

## 常见问题
**Q: 页面空白或 404？**  
A: 确保 `templates/index.html` 与 `static/` 存在，且首页路由 `/` 已注册。

**Q: 卡片重叠？**  
A: 刷新页面触发重新布局；手动拖拽也可临时调整。

**Q: 正文不显示或溢出？**  
A: 检查 LLM 返回的 `description` 是否为空；前端已做回退（空则用 `name` 填充）。

**Q: 如何禁用自动展开？**  
A: 在 `main.js` 的 `startProject` 中注释掉“自动展开项目框架子节点”的代码块即可。

## 后续可扩展
- 增加“自动展开深度”开关与最大节点数限制
- 支持导出 PNG/PDF 或生成 Markdown 报告
- 引入缓存避免重复 LLM 调用
- 卡片内嵌复选框，将“开发计划”转为任务清单

## 许可证
MIT（仅示例，可按需修改）

---
Happy brainstorming! 🚀