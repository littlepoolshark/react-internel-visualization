import { parse, type ParserPlugin } from '@babel/parser';
import type { File } from '@babel/types';

export interface ParseCodeResult {
  success: true;
  ast: File;
}

export interface ParseCodeError {
  success: false;
  message: string;
}

/**
 * Parse TSX/JSX code into a Babel AST.
 * Returns a user-facing error message on failure.
 */
export function parseCode(code: string): ParseCodeResult | ParseCodeError {
  const plugins: ParserPlugin[] = ['jsx', 'typescript'];
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins,
    });
    return { success: true, ast };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message.replace(/^.*?:\s*/, '') // strip Babel prefix
        : 'Unknown parse error';
    return { success: false, message: `语法错误: ${msg}` };
  }
}

