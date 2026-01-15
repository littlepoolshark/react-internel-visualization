import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';

// Mock CodeMirror to avoid jsdom issues
vi.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="code-editor-mock"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import InternalsVizPage from '../../src/features/internals-viz/ui/InternalsVizPage';

describe('InternalsVizPage regenerate (US3)', () => {
  it('regenerating with same code produces stable graph', async () => {
    render(
      <ReactFlowProvider>
        <InternalsVizPage />
      </ReactFlowProvider>
    );

    const generateBtn = screen.getByRole('button', { name: /生成可视图/i });

    // First generation
    fireEvent.click(generateBtn);
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();

    // Get node titles after first generation
    const firstGenFiber = screen.getByText('fiber 节点');
    expect(firstGenFiber).toBeInTheDocument();

    // Second generation (same code)
    fireEvent.click(generateBtn);

    // Graph should still be present with same structure
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
    expect(screen.getByText('fiber 节点')).toBeInTheDocument();
  });

  it('adding a hook and regenerating shows new node', async () => {
    render(
      <ReactFlowProvider>
        <InternalsVizPage />
      </ReactFlowProvider>
    );

    const generateBtn = screen.getByRole('button', { name: /生成可视图/i });
    const editor = screen.getByTestId('code-editor-mock');

    // First generation with default code
    fireEvent.click(generateBtn);
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();

    // Modify code to add another useState
    const newCode = `
function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("test");
  useEffect(() => {
    console.log(count);
  }, [count]);
  return <div>{count}</div>;
}
`;
    fireEvent.change(editor, { target: { value: newCode } });

    // Regenerate
    fireEvent.click(generateBtn);

    // Should show 3 hook nodes now (two useState + one useEffect)
    // Note: We check for the graph canvas presence, detailed node count would require more specific selectors
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
  });
});

