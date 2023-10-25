import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'insertionfinder',
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    sourcemaps(),
  ],
});
