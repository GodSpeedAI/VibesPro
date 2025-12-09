import 'ts-node/register/transpile-only';

declare global {
  var __vite_ssr_exportName__:
    | ((target: Record<string, unknown> | undefined, name: string, getter: () => unknown) => void)
    | undefined;
}

if (typeof globalThis.__vite_ssr_exportName__ === 'undefined') {
  Object.defineProperty(globalThis, '__vite_ssr_exportName__', {
    value: (target: Record<string, unknown> | undefined, name: string, getter: () => unknown) => {
      if (!target || typeof target !== 'object') {
        return;
      }
      Object.defineProperty(target, name, {
        get: getter,
        enumerable: true,
        configurable: true,
      });
    },
  });
}
