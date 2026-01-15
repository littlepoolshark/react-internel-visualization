import { useState, useCallback, useEffect } from "react";
import { Splitter, Button, Alert } from "antd";
import { useNodesState, useEdgesState } from "reactflow";

import CodeEditorPanel from "./CodeEditorPanel";
import GraphCanvas from "./GraphCanvas";
import { EXAMPLE_CODE } from "../domain/exampleCode";
import { parseCode } from "../parser/parseCode";
import { collectHooks } from "../parser/collectHooks";
import { buildGraph } from "../parser/buildGraph";
import { validateGraph } from "../domain/validate";
import { toReactFlow, type ObjectNodeData } from "./toReactFlow";
import { mergePositions } from "./mergePositions";

type Status = "empty" | "success" | "error";

/**
 * Main page: left editor + right canvas with generate button.
 * FR-005a: Uses useNodesState for draggable nodes.
 * US3: Preserves node positions on regenerate via mergePositions.
 */
export default function InternalsVizPage() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [status, setStatus] = useState<Status>("empty");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<ObjectNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleGenerate = useCallback(() => {
    // 1. Parse code
    const parseResult = parseCode(code);
    if (!parseResult.success) {
      setStatus("error");
      setErrorMsg(parseResult.message);
      return;
    }

    // 2. Collect hooks
    const hooks = collectHooks(parseResult.ast);

    // 3. Build domain graph
    const graph = buildGraph(hooks);

    // 4. Validate
    const validationErrors = validateGraph(graph.nodes, graph.edges);
    if (validationErrors.length > 0) {
      setStatus("error");
      setErrorMsg(`图数据校验失败: ${validationErrors.join("; ")}`);
      return;
    }

    // 5. Convert to ReactFlow
    const { rfNodes, rfEdges } = toReactFlow(graph.nodes, graph.edges);

    // US3: Preserve positions for existing nodes
    setNodes((currentNodes) => mergePositions(currentNodes, rfNodes));
    setEdges(rfEdges);
    setStatus("success");
    setErrorMsg(null);
  }, [code, setNodes, setEdges]);

  // Auto-generate on first load
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      role="application"
      aria-label="React Internals Visualization Tool"
    >
      {/* Header with generate button */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderBottom: "1px solid #e8e8e8",
          background: "#fafafa",
        }}
        role="banner"
      >
        <strong>React Internals Visualization</strong>
        <Button
          type="primary"
          onClick={handleGenerate}
          aria-label="生成可视图：解析代码并生成对象关系图"
        >
          生成可视图
        </Button>
      </header>

      {/* Main content */}
      <Splitter style={{ flex: 1 }} aria-label="主内容区域">
        {/* Left: code editor */}
        <Splitter.Panel defaultSize="40%" min="20%" max="70%">
          <div role="region" aria-label="代码编辑区" style={{ height: "100%" }}>
            <CodeEditorPanel value={code} onChange={setCode} />
          </div>
        </Splitter.Panel>

        {/* Right: graph canvas or empty/error state */}
        <Splitter.Panel>
          <div role="region" aria-label="可视化区域" style={{ height: "100%" }}>
            {status === "empty" && (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                }}
                role="status"
                aria-live="polite"
              >
                请在左侧粘贴 React 组件代码并点击「生成可视图」
              </div>
            )}

            {status === "error" && (
              <div style={{ padding: 24 }} role="alert">
                <Alert
                  data-testid="error-message"
                  type="error"
                  showIcon
                  message="解析失败"
                  description={errorMsg}
                />
              </div>
            )}

            {status === "success" && (
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
              />
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
