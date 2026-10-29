// Lists class attributes in a site's templates that are not in canonical CUBE form.
import * as sass from "sass";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  LAYER_ORDER,
  classAttributes,
  classLayers,
  canonicalClassAttribute
} from "./class-groups.js";

const LAYER_MODULES = {
  composition: "compositions",
  block: "blocks",
  utility: "utilities"
};
const TEMPLATE = /\.(liquid|njk|md|html|js)$/;

function compileLayers(scssDir) {
  const uses = [
    ...readFileSync(path.join(scssDir, "root.scss"), "utf8").matchAll(
      /@use "([^"]+)"/g
    )
  ].map((m) => m[1]);
  return Object.fromEntries(
    LAYER_ORDER.map((layer) => {
      const url = uses.find((u) => path.basename(u) === LAYER_MODULES[layer]);
      const { css } = sass.compileString(`@use "${url}";`, {
        loadPaths: [scssDir],
        importers: [new sass.NodePackageImporter(scssDir)]
      });
      return [layer, css];
    })
  );
}

function templates(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory())
      return name === "node_modules" || name === "tests" ? [] : templates(file);
    return TEMPLATE.test(name) ? [file] : [];
  });
}

// sharedDirs hold templates shared with other sites, whose classes may belong to
// another site's local blocks: unknown classes there are not reported.
export function auditClassAttributes({ siteDir, sharedDirs = [] }) {
  const layers = classLayers(
    compileLayers(path.join(siteDir, "src/assets/scss"))
  );
  const sources = [
    ...templates(path.join(siteDir, "src")).map((file) => ({
      file,
      shared: false
    })),
    ...sharedDirs.flatMap((dir) =>
      templates(dir).map((file) => ({ file, shared: true }))
    )
  ];
  return sources.flatMap(({ file, shared }) =>
    [...classAttributes(readFileSync(file, "utf8"))].flatMap(
      ({ attribute, line }) => {
        const result = canonicalClassAttribute(attribute, layers);
        const where = `${file}:${line} class="${attribute}"`;
        if (result.unknown)
          return shared
            ? []
            : [`${where} — unknown class: ${result.unknown.join(", ")}`];
        return result.canonical === attribute
          ? []
          : [`${where} → "${result.canonical}"`];
      }
    )
  );
}
