import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('InternalsVizPage – error state', () => {
  it('shows user-facing error message on syntax error', async () => {
    render(<InternalsVizPage />);

    // Clear editor and type invalid code
    const editor = screen.getByRole('textbox');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'const x = (');

    // Click generate
    const btn = screen.getByRole('button', { name: /生成可视图/i });
    fireEvent.click(btn);

    // Expect error message visible
    const errorMsg = await screen.findByTestId('error-message');
    expect(errorMsg).toHaveTextContent(/语法错误/);
  });
});

