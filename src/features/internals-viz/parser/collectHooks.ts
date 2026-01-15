import traverse from '@babel/traverse';
import type { File, CallExpression, Node } from '@babel/types';
import type { HookCall } from '../domain/types';
import { hookId } from '../domain/stableId';
import generate from '@babel/generator';

/** Built-in React hooks to recognize */
const BUILT_IN_HOOKS = new Set([
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  'useContext',
  'useImperativeHandle',
  'useDebugValue',
  'useDeferredValue',
  'useTransition',
  'useId',
  'useSyncExternalStore',
  'useInsertionEffect',
]);

/** Effect hooks (for linking to Effect nodes) */
const EFFECT_HOOKS = new Set([
  'useEffect',
  'useLayoutEffect',
  'useInsertionEffect',
]);

/** Variable environment: variable name → initial value */
interface VarEnv {
  [key: string]: unknown;
}

/**
 * Collect built-in hook calls from the AST in call order.
 * Custom hooks are ignored (not expanded).
 * 
 * Two-pass approach:
 * 1. First pass: collect useState bindings to build variable environment
 * 2. Second pass: process useMemo with computed values
 */
export function collectHooks(ast: File): HookCall[] {
  const hooks: HookCall[] = [];
  const varEnv: VarEnv = {};

  // First pass: collect useState variable bindings
  traverse(ast, {
    VariableDeclarator(path) {
      const init = path.node.init;
      if (!init || init.type !== 'CallExpression') return;
      
      const callee = init.callee;
      let isUseState = false;
      
      if (callee.type === 'Identifier' && callee.name === 'useState') {
        isUseState = true;
      }
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'React' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'useState'
      ) {
        isUseState = true;
      }
      
      if (isUseState) {
        // Extract [stateName, setStateName] = useState(initialValue)
        const id = path.node.id;
        if (id.type === 'ArrayPattern' && id.elements.length >= 1) {
          const stateVar = id.elements[0];
          if (stateVar && stateVar.type === 'Identifier') {
            const initialValue = extractRawValue(init);
            if (initialValue !== undefined) {
              varEnv[stateVar.name] = initialValue;
            }
          }
        }
      }
    },
  });

  // Second pass: collect all hooks
  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;

      let hookName: string | null = null;

      // Direct call: useState(...)
      if (callee.type === 'Identifier' && BUILT_IN_HOOKS.has(callee.name)) {
        hookName = callee.name;
      }
      // Member call: React.useState(...)
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'React' &&
        callee.property.type === 'Identifier' &&
        BUILT_IN_HOOKS.has(callee.property.name)
      ) {
        hookName = callee.property.name;
      }

      if (hookName) {
        const index = hooks.length;
        const hook: HookCall = {
          hookType: hookName,
          id: hookId(index),
          index,
          initialValue: extractInitialValue(path.node),
          isEffect: EFFECT_HOOKS.has(hookName),
        };

        // Special handling for useMemo
        if (hookName === 'useMemo') {
          const memoInfo = extractMemoInfo(path.node, varEnv);
          if (memoInfo) {
            hook.memoValue = memoInfo.value;
            hook.memoDeps = memoInfo.deps;
          }
        }

        hooks.push(hook);
      }
    },
  });

  return hooks;
}

/**
 * Extract raw JavaScript value from AST node (for building var environment).
 */
function extractRawValue(node: CallExpression): unknown {
  const arg = node.arguments[0];
  if (!arg) return undefined;
  if (arg.type === 'NumericLiteral') return arg.value;
  if (arg.type === 'StringLiteral') return arg.value;
  if (arg.type === 'BooleanLiteral') return arg.value;
  if (arg.type === 'NullLiteral') return null;
  if (arg.type === 'Identifier' && arg.name === 'undefined') return undefined;
  return undefined;
}

/**
 * Try to extract a simple initial value snippet (for useState) for display.
 */
function extractInitialValue(node: CallExpression): string | undefined {
  const arg = node.arguments[0];
  if (!arg) return undefined;
  if (arg.type === 'NumericLiteral') return String(arg.value);
  if (arg.type === 'StringLiteral') return `"${arg.value}"`;
  if (arg.type === 'BooleanLiteral') return String(arg.value);
  if (arg.type === 'NullLiteral') return 'null';
  if (arg.type === 'Identifier' && arg.name === 'undefined') return 'undefined';
  // Fallback: cannot inline
  return undefined;
}

/**
 * Extract useMemo info: compute the memoized value using the factory function.
 */
function extractMemoInfo(
  node: CallExpression,
  varEnv: VarEnv
): { value: string; deps: string[] } | undefined {
  const [factoryArg, depsArg] = node.arguments;
  
  // Extract dependency array
  const deps: string[] = [];
  if (depsArg && depsArg.type === 'ArrayExpression') {
    for (const elem of depsArg.elements) {
      if (elem && elem.type === 'Identifier') {
        deps.push(elem.name);
      }
    }
  }

  // Extract and execute factory function
  if (factoryArg && (factoryArg.type === 'ArrowFunctionExpression' || factoryArg.type === 'FunctionExpression')) {
    try {
      // Generate code from the factory function body
      const body = factoryArg.body;
      let code: string;
      
      if (body.type === 'BlockStatement') {
        // Function with block body: extract return statement
        code = generate(body as Node).code;
      } else {
        // Arrow function with expression body: () => expr
        code = generate(body as Node).code;
        code = `return ${code}`;
      }

      // Build function with captured variables
      const varNames = Object.keys(varEnv);
      const varValues = varNames.map(name => varEnv[name]);
      
      // Create a safe evaluation function
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function(...varNames, code);
      const result = fn(...varValues);
      
      // Format result for display
      const displayValue = formatValue(result);
      return { value: displayValue, deps };
    } catch {
      // If execution fails, return undefined
      return { value: '[计算失败]', deps };
    }
  }

  return undefined;
}

/**
 * Format a JavaScript value for display.
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`;
  if (typeof value === 'object') return '[Object]';
  if (typeof value === 'function') return '[Function]';
  return String(value);
}

