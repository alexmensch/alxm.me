import * as sass from "sass";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const SCSS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "scss"
);

export function compile(relativePath) {
  return sass.compile(join(SCSS_DIR, relativePath), {
    importers: [new sass.NodePackageImporter(SCSS_DIR)]
  }).css;
}

export function rules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selector, body]) => ({
      selectors: selector.split(",").map((s) => s.trim()),
      declarations: body
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean)
    })
  );
}
