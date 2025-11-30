from flask import Flask, request, jsonify, render_template
from openai import OpenAI
import json, os
from dotenv import load_dotenv

load_dotenv(".env")
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

API_KEY = os.getenv("LLM_API_KEY", "")
BASE_URL = "https://api.moonshot.cn/v1"
MODEL = "kimi-k2-turbo-preview"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

def prompt_for(parent_type, parent_content):
    base_req = (
        "请仅输出严格JSON，不要代码块、不要多余文字。JSON字段: nodes(数组), stop(布尔)。"
        "每个nodes项必须包含name(简短标题)与description(50-120字的具体说明)。"
    )
    if parent_type == "core-idea":
        return f"""
{base_req}
任务：基于以下startup核心想法生成唯一一个节点 "项目框架"，其description给出整体框架概述（不超过120字）。
输入：{parent_content}
示例：{{"nodes":[{{"name":"项目框架","description":"围绕开发计划、视觉风格、开发难点、外部资源清单、商业模式等组织的整体框架概述..."}}],"stop":false}}
"""
    if parent_type == "项目框架":
        return f"""
{base_req}
任务：基于给定的项目框架，生成4-6个子节点，分别为：开发计划、视觉风格、开发难点、外部资源清单、商业模式（可按需增删），每个节点description为简短说明（50-120字）。
输入：{parent_content}
"""
    
    if parent_type == "开发计划":
        return f"""
{base_req}
任务：针对开发计划生成3-4个可执行阶段或任务。
输入：{parent_content}
示例：{{"nodes":[{{"name":"技术选型","description":"框架、语言、云服务的选择..."}}],"stop":false}}
"""
    if parent_type == "视觉风格":
        return f"""
{base_req}
任务：针对视觉风格生成3-4个设计要素或风格方向。
输入：{parent_content}
"""
    if parent_type == "开发难点":
        return f"""
{base_req}
任务：针对开发难点生成3-4个技术挑战或可行解法。
输入：{parent_content}
"""
    if parent_type == "外部资源清单":
        return f"""
{base_req}
任务：针对外部资源生成3-4个资源类型或服务商类型。
输入：{parent_content}
"""
    if parent_type == "商业模式":
        return f"""
{base_req}
任务：针对商业模式生成3-4个盈利方式或商业要素。
输入：{parent_content}
"""
    return f"""
{base_req}
任务：基于以下内容生成3-4个相关子节点。
输入：{parent_content}
"""

def extract_json(s):
    s = s.strip()
    if "```json" in s:
        s = s.split("```json")[1].split("```")[0]
    elif "```" in s:
        s = s.split("```")[1]
    try:
        data = json.loads(s)
    except Exception:
        return {"nodes": [], "stop": False}
    return {"nodes": data.get("nodes", []), "stop": bool(data.get("stop", False))}

def make_meta_nodes(child_nodes, depth):
    nodes = []
    for n in child_nodes:
        if isinstance(n, str):
            n = {"name": n, "description": ""}
        nid = f"node_{abs(hash(n.get('name','')))%100000}_{depth}"
        nodes.append({
            "id": nid,
            "name": n.get("name", ""),
            "description": n.get("description", "") or n.get("name", ""),
            "type": n.get("name", ""),
            "depth": depth,
            "expanded": False,
            "content": n.get("description", "") or n.get("name", "")
        })
    return nodes

def llm_generate(parent_type, content):
    try:
        r = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "你是严谨的助手，只输出严格JSON对象"},
                {"role": "user", "content": prompt_for(parent_type, content)}
            ],
            max_tokens=2048,
            temperature=0.7,
            top_p=0.95,
            frequency_penalty=0.0,
            presence_penalty=0.0
        )
        return extract_json(r.choices[0].message.content)
    except Exception:
        return {"nodes": [{"name": "开发计划", "description": "技术路线图"}, {"name": "视觉风格", "description": "设计方向"}], "stop": False}

@app.route('/api/health', methods=['GET'])
def health():
    ok_env = bool(API_KEY)
    ok_llm = False
    if ok_env:
        try:
            r = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": "PING"}],
                max_tokens=8,
                temperature=0.0
            )
            ok_llm = bool(r.choices and r.choices[0].message.content)
        except Exception:
            ok_llm = False
    return jsonify({"env": ok_env, "llm": ok_llm})

@app.route('/api/analyze_idea', methods=['POST'])
def analyze_idea():
    data = request.json or {}
    idea = data.get('content', '')
    res = llm_generate("core-idea", idea)
    return jsonify({"success": True, "nodes": make_meta_nodes(res["nodes"], 1), "stop": res["stop"]})

@app.route('/api/expand_node', methods=['POST'])
def expand_node():
    data = request.json or {}
    parent_content = data.get('content', '')
    parent_type = data.get('type', 'core-idea')
    depth = int(data.get('depth', 0)) + 1
    res = llm_generate(parent_type, parent_content)
    return jsonify({"success": True, "nodes": make_meta_nodes(res["nodes"], depth), "stop": res["stop"]})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
