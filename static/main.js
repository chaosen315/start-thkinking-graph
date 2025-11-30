const svg = d3.select("#graph").append("svg").attr("width", window.innerWidth).attr("height", window.innerHeight - 140);
const gLinks = svg.append("g");
const gNodes = svg.append("g");
let nodes = [];
let links = [];
let simulation;
let selectedNode = null;
const CARD_WIDTH = 280;
const H_PADDING = 10;
const LEVEL_GAP = 40;

function computeLayout() {
  const width = parseInt(svg.attr("width"), 10);
  nodes.forEach(d => { d._h = cardHeight(d); d._w = CARD_WIDTH; });
  const byDepth = new Map();
  nodes.forEach(n => { const arr = byDepth.get(n.depth) || []; arr.push(n); byDepth.set(n.depth, arr); });
  const depths = Array.from(byDepth.keys()).sort((a,b)=>a-b);
  let yCursor = 10;
  const levelY = new Map();
  depths.forEach(d => {
    const maxH = Math.max(...byDepth.get(d).map(x=>x._h));
    levelY.set(d, yCursor);
    yCursor += maxH + LEVEL_GAP;
  });
  depths.forEach(d => {
    const arr = byDepth.get(d);
    const gap = 40;
    const total = arr.length * CARD_WIDTH + Math.max(0, arr.length - 1) * gap;
    const start = Math.max(H_PADDING, Math.round((width - total) / 2));
    arr.forEach((n, i) => {
      n.x = start + i * (CARD_WIDTH + gap);
      n.y = levelY.get(d);
    });
  });
}

function render() {
  computeLayout();
  const vNodes = nodes.filter(n => !n.hidden);
  const vLinks = links.filter(l => {
    const s = getNode(l.source); const t = getNode(l.target);
    return s && t && !s.hidden && !t.hidden;
  });
  const linkSel = gLinks.selectAll("line").data(vLinks, d => (typeof d.source === "string" ? d.source : d.source.id) + "-" + (typeof d.target === "string" ? d.target : d.target.id));
  linkSel.exit().remove();
  const linkMerge = linkSel.enter().append("line").attr("stroke","#cbd5e1").attr("stroke-width",1.5).merge(linkSel);

  const nodeSel = gNodes.selectAll("g").data(vNodes, d => d.id);
  nodeSel.exit().remove();
  const nodeEnter = nodeSel.enter().append("g")
    .on("click", nodeClick);

  nodeEnter.append("rect").attr("rx",8).attr("ry",8).attr("width",CARD_WIDTH).attr("height", d => d._h)
    .attr("fill", d => colorByType(d.type)).attr("stroke","#cbd5e1").attr("stroke-width",1);
  const defs = nodeEnter.append("defs");
  defs.append("clipPath").attr("id", d => `clip-${d.id}`)
    .append("rect").attr("x",0).attr("y",0).attr("rx",8).attr("ry",8)
    .attr("width", CARD_WIDTH).attr("height", d => d._h);
  nodeEnter.append("text").attr("x",H_PADDING).attr("y",24).text(d => d.name).attr("font-size","14").attr("fill","#1f2937");
  nodeEnter.append("text").attr("class","content").attr("clip-path", d => `url(#clip-${d.id})`).attr("x",H_PADDING).attr("y",48).attr("font-size","12").attr("fill","#334155");
  nodeEnter.append("text")
    .attr("class","collapse-btn")
    .attr("x", CARD_WIDTH - 18)
    .attr("y", 20)
    .text(d => d.collapsed ? "▾" : "▴")
    .attr("font-size","14")
    .attr("fill","#334155")
    .style("cursor","pointer")
    .on("click", collapseClick);
  nodeEnter.append("text")
    .attr("class","children-btn")
    .attr("x", CARD_WIDTH - 34)
    .attr("y", 20)
    .text(d => d.childrenHidden ? "＋" : "−")
    .attr("font-size","14")
    .attr("fill","#334155")
    .style("cursor","pointer")
    .on("click", childrenClick);

  const nodeMerge = nodeEnter.merge(nodeSel);
  nodeMerge.attr("transform", d => `translate(${d.x},${d.y})`);
  nodeMerge.select("rect").attr("height", d => d._h);
  nodeMerge.each(function(d){
    const sel = d3.select(this);
    sel.select("clipPath rect").attr("height", d._h);
    const content = sel.select("text.content");
    const text = displayContent(d);
    wrapMeasured(content, text, CARD_WIDTH - 2*H_PADDING);
    sel.select("text.collapse-btn").text(d.collapsed ? "▾" : "▴");
    sel.select("text.children-btn").text(d.childrenHidden ? "＋" : "−");
  });

  linkMerge
    .attr("x1", d => centerX(getNode(d.source)))
    .attr("y1", d => centerY(getNode(d.source)))
    .attr("x2", d => centerX(getNode(d.target)))
    .attr("y2", d => centerY(getNode(d.target)));
}

function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

function centerX(n){ return (n?.x || 0) + (n?._w || CARD_WIDTH)/2; }
function centerY(n){ return (n?.y || 0) + (n?._h || 80)/2; }
function getNode(idOrObj){
  if (typeof idOrObj !== "string") return idOrObj;
  return nodes.find(nn => nn.id === idOrObj) || { x:0, y:0, _w:CARD_WIDTH, _h:80 };
}

function colorByType(t) {
  if (t === "core-idea") return "#e0f2fe";
  if (t === "开发计划") return "#dcfce7";
  if (t === "视觉风格") return "#fef3c7";
  if (t === "开发难点") return "#fee2e2";
  if (t === "外部资源清单") return "#ede9fe";
  if (t === "商业模式") return "#d1fae5";
  return "#f1f5f9";
}

function short(s, n) { if (!s) return ""; return s.length > n ? s.slice(0, n) + "...": s; }
function addNode(node) { nodes.push(node); }
function addEdge(a, b) { links.push({ source: a.id, target: b.id }); }
function getId(x) { return typeof x === "string" ? x : x.id; }
function childrenOf(id) { return links.filter(l => getId(l.source) === id).map(l => getId(l.target)); }

function displayContent(d) {
  if (!d) return "";
  const text = d.content || "";
  return d.collapsed ? short(text, 60) : text;
}

function cardHeight(d) {
  const base = 80;
  if (!d || d.collapsed) return base;
  const text = d.content || "";
  const approxCharPx = 7;
  const perLine = Math.max(10, Math.floor((CARD_WIDTH - 2*H_PADDING) / approxCharPx));
  const lines = Math.max(1, Math.ceil(text.length / perLine));
  return base + (lines - 1) * 16;
}

function wrap(text, widthPx) {
  const s = text || "";
  const approxCharPx = 7;
  const n = Math.max(10, Math.floor(widthPx / approxCharPx));
  const lines = [];
  for (let i = 0; i < s.length; i += n) {
    lines.push(s.slice(i, i + n));
  }
  return lines;
}

function wrapMeasured(textSel, str, maxWidth) {
  const text = str || "";
  textSel.text("");
  const words = text.split(/\s+/);
  let line = [];
  let tspan = textSel.append("tspan").attr("x", H_PADDING).attr("dy", 0);
  for (let i = 0; i < words.length; i++) {
    line.push(words[i]);
    tspan.text(line.join(" "));
    if (tspan.node().getComputedTextLength() > maxWidth) {
      line.pop();
      tspan.text(line.join(" "));
      line = [words[i]];
      tspan = textSel.append("tspan").attr("x", H_PADDING).attr("dy", 14).text(words[i]);
      if (tspan.node().getComputedTextLength() > maxWidth) {
        let chunk = "";
        tspan.text("");
        for (let c of words[i]) {
          const next = chunk + c;
          tspan.text(next);
          if (tspan.node().getComputedTextLength() > maxWidth) {
            if (chunk.length > 0) tspan.text(chunk);
            chunk = c;
            tspan = textSel.append("tspan").attr("x", H_PADDING).attr("dy", 14).text(c);
          } else {
            chunk = next;
          }
        }
      }
    }
  }
}

function removeSubtree(rootId) {
  const toDelete = new Set();
  const stack = childrenOf(rootId);
  while (stack.length) {
    const cur = stack.pop();
    if (!toDelete.has(cur)) {
      toDelete.add(cur);
      childrenOf(cur).forEach(c => stack.push(c));
    }
  }
  nodes = nodes.filter(n => !toDelete.has(n.id));
  links = links.filter(l => !toDelete.has(getId(l.source)) && !toDelete.has(getId(l.target)));
}

function setSubtreeHidden(rootId, hidden) {
  const stack = childrenOf(rootId);
  while (stack.length) {
    const cid = stack.pop();
    const n = nodes.find(nn => nn.id === cid);
    if (!n) continue;
    n.hidden = hidden;
    childrenOf(cid).forEach(k => stack.push(k));
  }
}

async function startProject() {
  const idea = document.getElementById("coreIdea").value.trim();
  if (!idea) return;
  nodes = []; links = [];
  const root = { id: "root", name: "core-idea", type: "core-idea", depth: 0, expanded: true, content: idea, collapsed: false };
  addNode(root); render();
  const r = await fetch("/api/analyze_idea", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: idea }) });
  const data = await r.json();
  if (data.success && Array.isArray(data.nodes)) {
    data.nodes.forEach(n => { n.collapsed = true; addNode(n); addEdge(root, n); });
    render();
    const framework = data.nodes.find(x => x.type === "项目框架" || x.name === "项目框架");
    if (framework) {
      const rf = await fetch("/api/expand_node", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: framework.content, type: framework.type, depth: framework.depth }) });
      const df = await rf.json();
      if (df.success && Array.isArray(df.nodes)) {
        df.nodes.forEach(n => { n.collapsed = true; addNode(n); addEdge(framework, n); });
        framework.expanded = true;
        render();
      }
    }
  }
}

function nodeClick(event, d) {
  if (event.ctrlKey) {
    d.collapsed = !d.collapsed;
    render();
  } else {
    onNodeDblClick(event, d);
  }
}

function onNodeDblClick(event, d) {
  selectedNode = d;
  document.getElementById("insName").textContent = d.name;
  document.getElementById("insType").textContent = d.type;
  document.getElementById("insContent").value = d.content || "";
  document.getElementById("inspector").style.display = "block";
}

// collapse toggled by Ctrl+Click via nodeClick

document.getElementById("insSave").addEventListener("click", async () => {
  if (!selectedNode) return;
  const newContent = document.getElementById("insContent").value.trim();
  if (!newContent) return;
  selectedNode.content = newContent;
  removeSubtree(selectedNode.id);
  render();
  const r = await fetch("/api/expand_node", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newContent, type: selectedNode.type, depth: selectedNode.depth }) });
  const data = await r.json();
  if (data.success && Array.isArray(data.nodes)) {
    data.nodes.forEach(n => { n.collapsed = true; addNode(n); addEdge(selectedNode, n); });
    selectedNode.expanded = true;
    render();
  }
  document.getElementById("inspector").style.display = "none";
  selectedNode = null;
});

document.getElementById("insCancel").addEventListener("click", () => {
  document.getElementById("inspector").style.display = "none";
  selectedNode = null;
});

document.getElementById("startBtn").addEventListener("click", startProject);

document.getElementById("healthBtn").addEventListener("click", async () => {
  try {
    const r = await fetch("/api/health");
    const data = await r.json();
    alert(`env=${data.env}, llm=${data.llm}`);
  } catch(e) {
    alert("健康检查失败");
  }
});

document.getElementById("insExpand").addEventListener("click", async () => {
  if (!selectedNode) return;
  const r = await fetch("/api/expand_node", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: selectedNode.content, type: selectedNode.type, depth: selectedNode.depth }) });
  const data = await r.json();
  if (data.success && Array.isArray(data.nodes)) {
    data.nodes.forEach(n => { addNode(n); addEdge(selectedNode, n); });
    selectedNode.expanded = true;
    render();
  }
});
function collapseClick(event, d) {
  event.stopPropagation();
  d.collapsed = !d.collapsed;
  render();
}
function childrenClick(event, d) {
  event.stopPropagation();
  d.childrenHidden = !d.childrenHidden;
  setSubtreeHidden(d.id, d.childrenHidden);
  render();
}

const zoom = d3.zoom().scaleExtent([0.5, 2]).on("zoom", (event) => {
  gLinks.attr("transform", event.transform);
  gNodes.attr("transform", event.transform);
});
svg.call(zoom);

document.getElementById("exportBtn").addEventListener("click", () => {
  const md = buildMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "节点文档.md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
});

function buildMarkdown() {
  const lines = ["# 节点文档\n"]; 
  const root = nodes.find(n => n.type === "core-idea" || n.name === "core-idea") || nodes[0];
  if (root) {
    lines.push("## 核心想法\n" + (root.content || "") + "\n");
    const firstLevel = childrenOf(root.id).map(id => getNode(id)).filter(n => n && !n.hidden);
    firstLevel.forEach(n => dfsToLines(n, 1, lines));
  } else {
    nodes.filter(n => !n.hidden).forEach(n => dfsToLines(n, n.depth || 0, lines));
  }
  return lines.join("\n");
}

function dfsToLines(node, level, lines) {
  if (!node) return;
  const header = "#".repeat(Math.min(6, level + 2));
  const name = node.name || "未命名";
  const text = node.content || "";
  lines.push(`${header} ${name}`);
  lines.push(text);
  lines.push("");
  const children = childrenOf(node.id).map(id => getNode(id)).filter(n => n && !n.hidden);
  children.forEach(c => dfsToLines(c, level + 1, lines));
}
