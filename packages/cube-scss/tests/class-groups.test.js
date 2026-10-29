import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classAttributes,
  classLayers,
  canonicalClassAttribute
} from "../lib/class-groups.js";

const layers = classLayers({
  composition: ".flow > * + * {} .cluster {} .box {}",
  block:
    ".contact-options .button:hover {} .button {} .contact-options {} .site-header__brand a {}",
  utility: ".bg-dark {} .padding-s {} .radius {}"
});

describe("classLayers", () => {
  it("places a class where it first leads a selector", () => {
    assert.ok(layers.get("button").order > layers.get("contact-options").order);
    assert.equal(layers.get("button").layer, "block");
  });
});

describe("canonicalClassAttribute", () => {
  const canonical = (attribute) => canonicalClassAttribute(attribute, layers);

  it("orders brackets composition → block → utility", () => {
    assert.deepEqual(canonical("[ button ] [ box ] [ radius ]"), {
      canonical: "[ box ] [ button ] [ radius ]"
    });
  });

  it("merges one layer split across brackets and splits mixed brackets", () => {
    assert.deepEqual(canonical("[ cluster padding-s ] [ flow ]"), {
      canonical: "[ flow cluster ] [ padding-s ]"
    });
  });

  it("orders classes within a bracket by stylesheet order", () => {
    assert.deepEqual(canonical("[ radius padding-s bg-dark ]"), {
      canonical: "[ bg-dark padding-s radius ]"
    });
  });

  it("brackets an unbracketed multi-class attribute", () => {
    assert.deepEqual(canonical("flow padding-s"), {
      canonical: "[ flow ] [ padding-s ]"
    });
  });

  it("leaves a bare single class alone", () => {
    assert.deepEqual(canonical("flow"), { canonical: "flow" });
  });

  it("reports classes no layer defines", () => {
    assert.deepEqual(canonical("[ flow ] [ mystery ]"), {
      unknown: ["mystery"]
    });
  });
});

describe("classAttributes", () => {
  it("finds literal class attributes and skips template-interpolated ones", () => {
    const found = [
      ...classAttributes('<a class="[ box ]">\n<b class="{{ x }} flow">')
    ];
    assert.deepEqual(found, [{ attribute: "[ box ]", line: 1 }]);
  });
});
