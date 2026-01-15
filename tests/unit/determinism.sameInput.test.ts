import { describe, it, expect } from 'vitest';
import { parseCode } from '../../src/features/internals-viz/parser/parseCode';
import { collectHooks } from '../../src/features/internals-viz/parser/collectHooks';
import { buildGraph } from '../../src/features/internals-viz/parser/buildGraph';

const SAMPLE_CODE = `
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    console.log(count);
  }, [count]);
  return <div>{count}</div>;
}
`;

describe('determinism: same input produces same graph IDs (US3)', () => {
  it('generates identical node IDs for the same input', () => {
    // First parse
    const result1 = parseCode(SAMPLE_CODE);
    expect(result1.success).toBe(true);
    if (!result1.success) return;
    const hooks1 = collectHooks(result1.ast);
    const graph1 = buildGraph(hooks1);

    // Second parse (same input)
    const result2 = parseCode(SAMPLE_CODE);
    expect(result2.success).toBe(true);
    if (!result2.success) return;
    const hooks2 = collectHooks(result2.ast);
    const graph2 = buildGraph(hooks2);

    // Node IDs should be identical
    const nodeIds1 = graph1.nodes.map((n) => n.id).sort();
    const nodeIds2 = graph2.nodes.map((n) => n.id).sort();
    expect(nodeIds1).toEqual(nodeIds2);

    // Edge IDs should be identical
    const edgeIds1 = graph1.edges.map((e) => e.id).sort();
    const edgeIds2 = graph2.edges.map((e) => e.id).sort();
    expect(edgeIds1).toEqual(edgeIds2);
  });

  it('generates identical node order for the same input', () => {
    // First parse
    const result1 = parseCode(SAMPLE_CODE);
    if (!result1.success) return;
    const hooks1 = collectHooks(result1.ast);
    const graph1 = buildGraph(hooks1);

    // Second parse
    const result2 = parseCode(SAMPLE_CODE);
    if (!result2.success) return;
    const hooks2 = collectHooks(result2.ast);
    const graph2 = buildGraph(hooks2);

    // Node order should be identical (not just IDs)
    expect(graph1.nodes.map((n) => n.id)).toEqual(graph2.nodes.map((n) => n.id));
    expect(graph1.edges.map((e) => e.id)).toEqual(graph2.edges.map((e) => e.id));
  });
});

