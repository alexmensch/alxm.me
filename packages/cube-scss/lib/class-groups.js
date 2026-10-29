// Canonical CUBE class attributes: one bracket per layer, brackets and the
// classes inside them in the order their CSS is applied.

export const LAYER_ORDER = ["composition", "block", "utility"];

// layerCss: { composition, block, utility } — each layer compiled on its own.
// A class is placed where it first leads a selector, else where it first appears.
export function classLayers(layerCss) {
  const leading = new Map();
  const anywhere = new Map();
  let position = 0;
  for (const layer of LAYER_ORDER) {
    for (const [, selectorList] of layerCss[layer].matchAll(/([^{}]+)\{/g)) {
      for (const selector of selectorList.split(",")) {
        const [head] = selector.trim().split(/[\s>+~]+/);
        for (const [, name] of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
          const place = { layer, order: position++ };
          if (!anywhere.has(name)) anywhere.set(name, place);
          if (head.includes(`.${name}`) && !leading.has(name))
            leading.set(name, place);
        }
      }
    }
  }
  return new Map(
    [...anywhere].map(([name, place]) => [name, leading.get(name) ?? place])
  );
}

// Returns { canonical } or { unknown: [class, …] }.
export function canonicalClassAttribute(attribute, layers) {
  const classes = attribute.replace(/[[\]]/g, " ").split(/\s+/).filter(Boolean);
  if (classes.length < 2 && !attribute.includes("["))
    return { canonical: attribute };
  const unknown = classes.filter((name) => !layers.has(name));
  if (unknown.length) return { unknown };
  const groups = LAYER_ORDER.map((layer) =>
    classes
      .filter((name) => layers.get(name).layer === layer)
      .sort((a, b) => layers.get(a).order - layers.get(b).order)
  ).filter((group) => group.length);
  return {
    canonical: groups.map((group) => `[ ${group.join(" ")} ]`).join(" ")
  };
}

export function* classAttributes(text) {
  for (const match of text.matchAll(/class=(["'])([^"'{}]*)\1/g)) {
    yield {
      attribute: match[2],
      line: text.slice(0, match.index).split("\n").length
    };
  }
}
