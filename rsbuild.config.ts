import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    // Polyfill process.env for Babel packages running in browser
    define: {
      'process.env': JSON.stringify({}),
    },
  },
});
