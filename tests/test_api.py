from app import app

def test_analyze_idea_generates_project_framework(monkeypatch):
    import app as app_mod

    def fake_llm_generate(parent_type, content):
        assert parent_type == "core-idea"
        return {"nodes": [{"name": "项目框架", "description": "整体框架概述"}], "stop": False}

    monkeypatch.setattr(app_mod, "llm_generate", fake_llm_generate)

    c = app.test_client()
    r = c.post("/api/analyze_idea", json={"content": "AI助理改造传统客服"})
    assert r.status_code == 200
    data = r.get_json()
    assert data["success"] is True
    assert isinstance(data["nodes"], list)
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["name"] == "项目框架"
    assert len(data["nodes"][0]["description"]) > 0


def test_expand_node_under_project_framework(monkeypatch):
    import app as app_mod

    def fake_llm_generate(parent_type, content):
        assert parent_type == "项目框架"
        return {
            "nodes": [
                {"name": "开发计划", "description": "技术路线与里程碑"},
                {"name": "视觉风格", "description": "UI/UX方向"},
                {"name": "开发难点", "description": "技术挑战与解法"},
                {"name": "外部资源清单", "description": "云服务与资质"},
                {"name": "商业模式", "description": "盈利与定价"},
            ],
            "stop": False
        }

    monkeypatch.setattr(app_mod, "llm_generate", fake_llm_generate)

    c = app.test_client()
    r = c.post("/api/expand_node", json={"content": "整体框架概述", "type": "项目框架", "depth": 0})
    assert r.status_code == 200
    data = r.get_json()
    assert data["success"] is True
    assert isinstance(data["nodes"], list)
    assert len(data["nodes"]) >= 4
    names = {n["name"] for n in data["nodes"]}
    assert {"开发计划", "视觉风格", "开发难点", "外部资源清单"}.issubset(names)
