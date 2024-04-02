import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      // Override the module compiler option to ESNext
      tsconfigOverride: {
        include: ['src/**/*'],
        compilerOptions: { module: 'ESNext', moduleResolution: 'node' },
      },
    }),
  ],
  output: [
    { file: 'dist/index.cjs', format: 'cjs' },
    { file: 'dist/index.mjs', format: 'es' },
  ],
};
