import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * CodeMirror-based TSX/JSX editor panel.
 */
export default function CodeEditorPanel({ value, onChange }: Props) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[javascript({ jsx: true, typescript: true })]}
      onChange={onChange}
      style={{ height: '100%', overflow: 'auto' }}
      aria-label="Code editor"
    />
  );
}

