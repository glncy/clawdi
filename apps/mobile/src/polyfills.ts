// Polyfill DOMException for Vercel AI SDK (not available in React Native runtime)
if (typeof globalThis.DOMException === "undefined") {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name ?? "DOMException";
    }
  } as unknown as typeof globalThis.DOMException;
}
