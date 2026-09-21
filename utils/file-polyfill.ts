// Minimal File polyfill for Node environments lacking File (e.g., Node 16/18)
const hasFile = typeof File !== "undefined";

if (!hasFile) {
  class PolyfillFile extends Blob {
    name: string;
    lastModified: number;

    constructor(bits: BlobPart[], name: string, options: FilePropertyBag = {}) {
      super(bits, options);
      this.name = name;
      this.lastModified = options.lastModified ?? Date.now();
    }
  }

  // @ts-expect-error - augment global when File is missing
  globalThis.File = PolyfillFile;
}
