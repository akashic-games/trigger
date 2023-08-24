import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/cjs/index.cjs",
      format: "cjs",
    },
    {
      file: "dist/cjs/index.min.cjs",
      format: "cjs",
      plugins: [terser()],
    },
    {
      file: "dist/esm/index.js",
      format: "esm",
    },
    {
      file: "dist/esm/index.min.js",
      format: "esm",
      plugins: [terser()],
    }
  ],
  plugins: [
    typescript({
      declaration: false,
    }),
    commonjs({
      extensions: [".js", ".ts"]
    }),
    nodeResolve()
  ]
};
