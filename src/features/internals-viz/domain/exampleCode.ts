/**
 * Default example code shown in the editor on first load.
 */
export const EXAMPLE_CODE = `import { useState, useEffect, useLayoutEffect, useMemo } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    console.log('useLayoutEffect');
  }, []);


  const doubled = useMemo(() => {
    return count * 2;
  }, [count]);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
`;
