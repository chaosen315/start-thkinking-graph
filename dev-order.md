# Startup Idea Graph MVP 开发订单文档

## 项目概述

项目名称：Startup Idea Graph MVP
目标：实现一个可视化架构图工具，支持输入核心想法并生成相关卡片，支持编辑卡片内容并刷新其下文

## 核心功能需求

### 功能1：核心想法输入与卡片生成（更新）
- 初始页面显示一个可输入文本的卡片（标签：core-idea）
- 用户输入startup想法后点击“项目启动”按钮
- 系统仅生成一个第一层节点：项目框架（标题+正文短文概述）
- 在项目框架下自动生成子节点：开发计划、视觉风格、开发难点、外部资源清单、商业模式（每个节点均为标题+正文短文）
- 卡片以节点形式展示，支持拖拽和可视化交互

### 功能2：卡片内容编辑与下文刷新（更新）
- 单击节点切换折叠/展开（折叠显示摘要，展开显示全文并动态增长高度）
- 双击任意卡片打开编辑面板，修改正文后保存
- 保存后自动删除该卡片的所有子节点，并基于新内容重新生成子节点
- 编辑面板提供“展开一层”按钮，可不编辑直接扩展该节点下一层

## 技术架构

### 后端技术栈
- **框架**：Flask (Python)
- **LLM API**：OpenAI兼容API (Moonshot Kimi)
- **环境管理**：.venv虚拟环境
- **依赖管理**：uv包管理器
- **配置管理**：环境变量

### 前端技术栈
- **可视化**：D3.js v7
- **交互**：原生JavaScript
- **样式**：CSS3
- **布局**：响应式设计

### API配置参数
```
base_url: https://api.moonshot.cn/v1
model: kimi-k2-turbo-preview
max_tokens: 2048
temperature: 0.7
top_p: 0.95
frequency_penalty: 0.0
presence_penalty: 0.0
```

## 核心函数开发要求

### 后端核心函数

#### 1. prompt_for(parent_type, parent_content)
- **功能**：根据节点类型生成对应的LLM提示词
- **输入**：parent_type (字符串), parent_content (字符串)
- **输出**：格式化的提示词字符串
- **要求**：
  - 支持core-idea、开发计划、视觉风格、开发难点、外部资源清单、商业模式等类型
  - 提示词必须要求LLM返回严格JSON格式
  - JSON字段必须包含nodes数组和可选的stop布尔值

#### 2. extract_json(s)
- **功能**：从LLM响应中提取JSON数据
- **输入**：LLM响应字符串
- **输出**：解析后的JSON对象 {nodes: [...], stop: bool}
- **要求**：
  - 处理可能的代码块标记（```json...```）
  - 解析失败时返回安全的默认值
  - 确保返回结构的一致性

#### 3. make_meta_nodes(child_nodes, depth)
- **功能**：将LLM子节点转换为前端节点数据结构
- **输入**：child_nodes (数组), depth (数字)
- **输出**：格式化后的节点数组
- **要求**：
  - 为每个节点生成唯一稳定的ID
  - 添加depth、expanded、content等元数据
  - 确保节点结构的一致性

#### 4. API端点

##### POST /api/analyze_idea
- **功能**：分析初始核心想法
- **输入**：{content: string}
- **输出**：{success: bool, nodes: [...], stop: bool}
- **要求**：
  - 调用LLM生成第一层节点
  - 返回格式化的节点数据
  - 处理LLM调用异常

##### POST /api/expand_node
- **功能**：扩展指定节点
- **输入**：{content: string, type: string, depth: number}
- **输出**：{success: bool, nodes: [...], stop: bool}
- **要求**：
  - 根据节点类型生成子节点
  - 支持递归深度控制
  - 返回格式化的子节点数据

### 前端核心函数

#### 1. startProject()
- **功能**：处理项目启动流程
- **要求**：
  - 获取用户输入的核心想法
  - 调用后端API生成第一层节点
  - 渲染根节点和第一层子节点
  - 处理API响应和错误

#### 2. onNodeClick(d)
- **功能**：处理节点点击事件（展开子节点）
- **要求**：
  - 检查节点是否已展开
  - 调用后端API获取子节点
  - 添加新节点和边到图中
  - 更新节点展开状态

#### 3. onNodeDblClick(d)
- **功能**：处理节点双击事件（打开编辑面板）
- **要求**：
  - 显示编辑面板
  - 填充当前节点信息
  - 支持内容编辑和保存

#### 4. removeSubtree(rootId)
- **功能**：删除指定节点的整个子树
- **要求**：
  - 递归删除所有子节点
  - 删除相关的边
  - 保持图的完整性

#### 5. 编辑保存处理
- **功能**：处理编辑后的保存操作
- **要求**：
  - 更新节点内容
  - 删除旧子树
  - 重新生成子节点
  - 更新可视化图

## 开发步骤规划

### 阶段1：环境搭建
1. 创建项目目录结构
2. 设置虚拟环境（.venv）
3. 初始化uv并安装依赖
4. 配置环境变量（LLM_API_KEY）

### 阶段2：后端开发（1.5天）
1. 实现核心工具函数（prompt_for, extract_json, make_meta_nodes）
2. 开发API端点（/api/analyze_idea, /api/expand_node）
3. 添加错误处理和日志记录
4. 本地测试API功能

### 阶段3：前端开发
1. 创建基础HTML结构和样式
2. 实现D3.js图可视化基础功能
3. 开发节点渲染和交互逻辑
4. 实现拖拽和布局功能
5. 开发编辑面板和保存逻辑

### 阶段4：集成测试
1. 前后端集成测试
2. 功能完整性验证
3. 性能优化和bug修复

### 阶段5：测试用例开发
1. 编写pytest测试用例
2. 实现LLM调用mock
3. 验证API响应格式
4. 确保测试覆盖率

### 阶段6：交付准备
1. 代码审查和优化
2. 文档整理和归档
3. 使用说明编写
4. 最终测试和打包

## 测试用例

### API测试用例

#### 测试1：分析核心想法
```python
def test_analyze_idea(monkeypatch):
    # Mock LLM响应
    monkeypatch.setattr("app.client", FakeClient())
    
    response = client.post("/api/analyze_idea", 
                          json={"content": "AI助理改造传统客服"})
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["nodes"], list)
    assert len(data["nodes"]) >= 1
```

#### 测试2：扩展节点
```python
def test_expand_node(monkeypatch):
    monkeypatch.setattr("app.client", FakeClient())
    
    response = client.post("/api/expand_node",
                          json={"content": "技术路线图", 
                                "type": "开发计划", 
                                "depth": 1})
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["nodes"], list)
    assert len(data["nodes"]) >= 1
```

### 前端测试用例

#### 测试3：项目启动流程
1. 在输入框中输入"AI助理改造传统客服"
2. 点击"项目启动"按钮
3. 验证：
   - 根节点正确显示
   - 生成4-6个第一层节点
   - 节点可以正常拖拽

#### 测试4：节点编辑功能
1. 双击任意节点
2. 修改节点内容
3. 点击"保存更新"
4. 验证：
   - 旧子节点被删除
   - 新生成子节点
   - 图正确更新

## 代码审查清单

### 1. 代码结构与命名
- [ ] 函数职责单一，命名清晰
- [ ] 代码注释完整，逻辑清晰
- [ ] 错误处理机制完善

### 2. 安全性
- [ ] API密钥仅通过环境变量获取
- [ ] 不记录或输出敏感信息
- [ ] 输入验证和清理机制

### 3. 性能与资源
- [ ] 避免不必要的LLM调用
- [ ] 前端重绘性能优化
- [ ] 内存泄漏检查

### 4. API契约
- [ ] 出入参结构稳定
- [ ] JSON格式一致性
- [ ] 错误响应标准化

### 5. 测试覆盖
- [ ] 核心API路径有测试
- [ ] 边界条件处理
- [ ] Mock机制完善

## 项目规则

### 开发规范
1. **环境管理**：统一使用`.venv`虚拟环境
2. **依赖管理**：使用`uv`进行包管理
3. **代码风格**：遵循PEP 8规范
4. **提交规范**：小步提交，有意义的提交信息

### LLM配置规则
```
base_url: https://api.moonshot.cn/v1
model: kimi-k2-turbo-preview
max_tokens: 2048
temperature: 0.7
top_p: 0.95
frequency_penalty: 0.0
presence_penalty: 0.0
```

### 质量要求
1. **API返回**：必须返回严格JSON格式
2. **错误处理**：LLM调用失败时返回安全默认值
3. **测试覆盖**：核心功能必须有测试用例
4. **文档完整**：代码注释和文档齐全

### 安全要求
1. **密钥管理**：禁止硬编码API密钥
2. **日志安全**：不记录敏感信息
3. **输入验证**：对用户输入进行验证和清理

### 交付标准
1. **功能完整**：所有核心功能正常工作
2. **测试通过**：所有测试用例通过
3. **文档齐全**：包含使用说明和API文档
4. **代码审查**：通过代码审查清单

## 运行说明

### 环境准备（Windows）
```powershell
# 创建虚拟环境
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 安装依赖
uv init
uv add flask openai pytest

# 设置API密钥
$env:LLM_API_KEY="你的密钥"
```

### 启动服务
```powershell
python d:\BaiduSyncdisk\项目库\new_work\app.py
```

### 运行测试
```powershell
python -m pytest
```

### 访问应用
打开浏览器访问：`http://localhost:5000`

## 交付物清单

### 代码文件
- [ ] `app.py` - 后端主程序
- [ ] `templates/index.html` - 前端页面
- [ ] `static/main.js` - 前端逻辑
- [ ] `static/styles.css` - 样式文件
- [ ] `tests/test_api.py` - 测试用例

### 文档文件
- [ ] `dev-order.md` - 本开发订单文档
- [ ] `README.md` - 项目使用说明（可选）
- [ ] `requirements.txt` - 依赖清单（由uv生成）

### 测试报告
- [ ] 测试用例执行结果
- [ ] 代码覆盖率报告
- [ ] 功能验收清单

## 风险与注意事项

### 技术风险
1. **LLM API限制**：确保API密钥有效且有足够配额
2. **网络延迟**：考虑添加超时机制和重试逻辑
3. **响应格式**：LLM输出可能不总是严格JSON，需要健壮解析

### 项目风险
1. **交付时间**：严格按照阶段计划执行
2. **质量要求**：必须通过所有测试用例
3. **安全合规**：不得泄露API密钥等敏感信息

## 验收标准

### 功能验收
- [ ] 能够输入核心想法并生成第一层卡片
- [ ] 能够双击编辑卡片内容
- [ ] 编辑保存后能正确刷新下文卡片
- [ ] 卡片支持拖拽和可视化交互

### 技术验收
- [ ] 所有API端点正常工作
- [ ] 所有测试用例通过
- [ ] 代码通过审查清单
- [ ] 文档完整且准确

### 交付验收
- [ ] 代码完整且可运行
- [ ] 文档齐全且清晰
- [ ] 测试报告完整
- [ ] 使用说明明确

---

**文档版本**：v1.0
**创建日期**：2025-11-30
**最后更新**：2025-11-30
**责任人**：开发团队负责人
**审核人**：项目负责人

## 附录

### 参考代码

#### Moonshot API 范例代码

- Partial Mode
在使用大模型时，有时我们希望通过预填（Prefill）部分模型回复来引导模型的输出。在 Kimi 大模型中，我们提供 Partial Mode 来实现这一功能，它可以帮助我们控制输出格式，引导输出内容，以及让模型在角色扮演场景中保持更好的一致性。您只需要在最后一个 role 为 assistant 的 messages 条目中，增加 "partial": True 即可开启 partial mode。

 {"role": "assistant", "content": leading_text, "partial": True},

注意！请勿混用 partial mode 和 response_format=json_object，否则可能会获得预期外的模型回复。
调用示例
- Json Mode
下面是使用 Partial Mode 来实现 Json Mode 的例子。
```python
from openai import OpenAI
 
client = OpenAI(
    api_key="$MOONSHOT_API_KEY",
    base_url="https://api.moonshot.cn/v1",
)
 
completion = client.chat.completions.create(
    model="kimi-k2-turbo-preview",
    messages=[
        {
            "role": "system",
            "content": "请从产品描述中提取名称、尺寸、价格和颜色，并在一个 JSON 对象中输出。",
        },
        {
            "role": "user",
            "content": "大米 SmartHome Mini 是一款小巧的智能家居助手，有黑色和银色两种颜色，售价为 998 元，尺寸为 256 x 128 x 128mm。可让您通过语音或应用程序控制灯光、恒温器和其他联网设备，无论您将它放在家中的任何位置。",
        },
        {
            "role": "assistant",
            "content": "{",
            "partial": True
        },
    ],
    temperature=0.6,
)
 
print('{'+completion.choices[0].message.content)
```
- 运行上述代码，返回：
```json
{"name": "SmartHome Mini", "size": "256 x 128 x 128mm", "price": "998元", "colors": ["黑色", "银色"]}
```
注意 API 的返回不包含 leading_text，为了得到完整的回复，你需要手动拼接它。
## 前端视觉风格要求（新增）

### 主题与整体气质
- 主题：浅色冷淡风（Minimal Light, Cool Tone）
- 整体感受：清爽、克制、留白充足、对比柔和但信息清晰

### 颜色规范（建议值，可按需微调）
- 背景：`#f7fafc`
- 主体表面：`#ffffff`
- 文本主色：`#1f2937`，次要文本：`#334155`
- 分隔/描边：`#e5e7eb`，连线：`#cbd5e1`
- 类型色（卡片填充，低饱和）：`core-idea=#e0f2fe`，`开发计划=#dcfce7`，`视觉风格=#fef3c7`，`开发难点=#fee2e2`，`外部资源清单=#ede9fe`，`商业模式=#d1fae5`，`默认=#f1f5f9`

### 版式与间距
- 字体：`system-ui`，正文 12–14px，标题 14–16px，行高 1.4–1.6
- 卡片：宽度 280px，圆角 8–12px，左右内边距 10px，弱阴影或描边
- 布局：自上而下分层；层间距随层内最大卡片高度动态叠加；同层横向固定间距避免重叠

### 交互与状态
- 折叠/展开：单击折叠/展开正文；折叠为摘要（≤60字）
- 编辑：双击打开编辑面板；保存更新后替换旧子树并生成新下文
- 反馈：按钮悬停轻微透明/阴影变化；不可点击态降低对比度

### 可访问性
- 文本对比度满足 WCAG AA（正文与背景对比度 ≥ 4.5）
- 焦点状态可见（outline 或背景微变）
- 命中区域 ≥ 40px（触控友好）

### 视觉审查清单
- 卡片不重叠、层级分明、类型色不喧宾夺主
- 连线两端位于卡片中心，线宽与颜色柔和
- 正文分行严格受卡片宽度约束，不溢出、不截断词义
- 编辑面板与主体风格一致、可读性良好、层级清晰
