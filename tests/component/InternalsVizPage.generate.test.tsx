import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InternalsVizPage from '../../src/features/internals-viz/ui/InternalsVizPage';

// Mock CodeMirror to avoid jsdom getClientRects issue
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      role="textbox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('InternalsVizPage – generate flow', () => {
  it('renders graph container after clicking 「生成可视图」', async () => {
    render(<InternalsVizPage />);

    // Click generate button
    const btn = screen.getByRole('button', { name: /生成可视图/i });
    fireEvent.click(btn);

    // Expect graph area to appear (by test-id or role)
    const canvas = await screen.findByTestId('graph-canvas');
    expect(canvas).toBeInTheDocument();
  });
});

