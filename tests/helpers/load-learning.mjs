import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
export function createLoader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute);
    if (absolute.endsWith('.json')) return JSON.parse(readFileSync(absolute, 'utf8'));
    const result = {};
    cache.set(absolute, result);
    const output = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const requireDependency = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'server-only') return {};
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(absolute), name);
        const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`].find(existsSync);
        if (!resolved) throw new Error(`Missing module ${base}`);
        return load(resolved);
      }
      return nativeRequire(name);
    };
    new Function('require', 'exports', '__dirname', output)(requireDependency, result, path.dirname(absolute));
    return result;
  }
  return load;
}
