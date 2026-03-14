import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ARTICLE_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "article.liquid"
);
const SUBSCRIBE_FORM_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "subscribe-form.liquid"
);
const CONTACT_OPTIONS_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "contact-options.liquid"
);
const CONTACT_LAYOUT_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "layouts",
  "contact.liquid"
);
const CONTACT_MD_PATH = join(__dirname, "..", "src", "contact.md");

let articleContent;
let subscribeFormContent;
let contactOptionsContent;
let contactLayoutContent;
let contactMdContent;

before(async () => {
  articleContent = await readFile(ARTICLE_PATH, "utf-8");
  subscribeFormContent = await readFile(SUBSCRIBE_FORM_PATH, "utf-8");
  contactOptionsContent = await readFile(CONTACT_OPTIONS_PATH, "utf-8");
  contactLayoutContent = await readFile(CONTACT_LAYOUT_PATH, "utf-8");
  contactMdContent = await readFile(CONTACT_MD_PATH, "utf-8");
});

describe("subscribe form placement in article.liquid", () => {
  it("renders subscribe-form after {{ content }}, not before it", () => {
    const contentIndex = articleContent.indexOf("{{ content }}");
    const subscribeIndex = articleContent.indexOf(
      'render "partials/subscribe-form"'
    );

    assert.notEqual(
      contentIndex,
      -1,
      "{{ content }} must exist in article.liquid"
    );
    assert.notEqual(
      subscribeIndex,
      -1,
      "subscribe-form render must exist in article.liquid"
    );
    assert.ok(
      subscribeIndex > contentIndex,
      "subscribe-form render must appear after {{ content }}"
    );
  });

  it("gates subscribe-form render with {% if subscription == true %}", () => {
    // Find the subscribe-form render and check the preceding if block
    const subscribeIndex = articleContent.indexOf(
      'render "partials/subscribe-form"'
    );
    assert.notEqual(subscribeIndex, -1, "subscribe-form render must exist");

    const precedingContent = articleContent.slice(0, subscribeIndex);
    const lines = precedingContent.split("\n");

    // Look for the if subscription == true condition in the lines before the render
    const hasSubscriptionGuard = lines.some((line) =>
      /\{%[-\s]*if\s+subscription\s*==\s*true\s*[-\s]*%\}/.test(line)
    );

    assert.ok(
      hasSubscriptionGuard,
      "subscribe-form render must be gated by {% if subscription == true %}"
    );
  });
});

describe("subscribe form text styling", () => {
  it("uses font-sans class on CTA paragraph without weight-extra-bold", () => {
    // Find the CTA <p> element
    const ctaMatch = subscribeFormContent.match(
      /<p[^>]*id="subscribe-cta"[^>]*>/
    );
    assert.ok(ctaMatch, "CTA paragraph with id subscribe-cta must exist");

    const ctaTag = ctaMatch[0];
    assert.ok(
      ctaTag.includes("font-sans"),
      "CTA paragraph must include font-sans class"
    );
    assert.ok(
      !ctaTag.includes("weight-extra-bold"),
      "CTA paragraph must not include weight-extra-bold class"
    );
  });
});

describe("subscribe form CTA copy", () => {
  it("uses updated CTA text in article.liquid render call", () => {
    const renderBlock = articleContent.slice(
      articleContent.indexOf('render "partials/subscribe-form"')
    );
    assert.ok(
      renderBlock.includes("Enjoyed this? Get new posts by email."),
      'article.liquid subscribe-form render must use CTA text "Enjoyed this? Get new posts by email."'
    );
  });

  it("uses updated default CTA text in subscribe-form.liquid", () => {
    assert.ok(
      subscribeFormContent.includes("Enjoyed this? Get new posts by email."),
      'subscribe-form.liquid default CTA must be "Enjoyed this? Get new posts by email."'
    );
  });
});

describe("subscribe card on contact page", () => {
  it("has a 4th option with type subscribe in contact.md", () => {
    // Parse the front matter options
    const frontMatter = contactMdContent.split("---")[1];
    assert.ok(frontMatter, "contact.md must have front matter");

    const hasSubscribeType = /type:\s*subscribe/.test(frontMatter);
    assert.ok(
      hasSubscribeType,
      "contact.md must have an option with type: subscribe"
    );

    // Count options - each option starts with "  - " at the option level
    const optionMatches = frontMatter.match(/^\s{2}- /gm);
    assert.ok(optionMatches, "contact.md must have options");
    assert.ok(
      optionMatches.length >= 4,
      `contact.md must have at least 4 options, found ${optionMatches.length}`
    );
  });

  it("renders subscribe form for option.type == subscribe in contact-options.liquid", () => {
    assert.ok(
      contactOptionsContent.includes("subscribe"),
      "contact-options.liquid must handle subscribe type"
    );

    // Check for a conditional that checks option.type == "subscribe"
    const hasTypeCheck = /option\.type\s*==\s*["']subscribe["']/.test(
      contactOptionsContent
    );
    assert.ok(
      hasTypeCheck,
      'contact-options.liquid must check for option.type == "subscribe"'
    );

    // Check that subscribe-form partial is rendered
    assert.ok(
      contactOptionsContent.includes('render "partials/subscribe-form"'),
      "contact-options.liquid must render subscribe-form partial for subscribe type"
    );
  });
});

describe("site data threading", () => {
  it("passes site through contact.liquid to article partial", () => {
    assert.ok(
      contactLayoutContent.includes("site:"),
      "contact.liquid must pass site to article partial"
    );
  });

  it("passes site through article.liquid to contact-options partial", () => {
    // Find the contact-options render call and check it includes site
    const contactOptionsRender = articleContent.match(
      /render\s+"partials\/contact-options"[^%]*/
    );
    assert.ok(
      contactOptionsRender,
      "article.liquid must render contact-options partial"
    );
    assert.ok(
      contactOptionsRender[0].includes("site:"),
      "article.liquid must pass site to contact-options partial"
    );
  });

  it("passes site through contact-options.liquid to subscribe-form partial", () => {
    const subscribeRender = contactOptionsContent.match(
      /render\s+"partials\/subscribe-form"[^%]*/
    );
    assert.ok(
      subscribeRender,
      "contact-options.liquid must render subscribe-form partial"
    );
    assert.ok(
      subscribeRender[0].includes("site:"),
      "contact-options.liquid must pass site to subscribe-form partial"
    );
  });
});

describe("subscribe card copy", () => {
  it("includes the expected subscribe card body text", () => {
    const expectedBody =
      "Get new posts delivered to your inbox — no spam, just articles.";

    // The body text could be in contact.md front matter or in contact-options.liquid
    const inContactMd = contactMdContent.includes(expectedBody);
    const inContactOptions = contactOptionsContent.includes(expectedBody);

    assert.ok(
      inContactMd || inContactOptions,
      `Subscribe card body must contain "${expectedBody}"`
    );
  });
});

describe("compact parameter for subscribe-form", () => {
  it("supports compact parameter in subscribe-form.liquid", () => {
    assert.ok(
      subscribeFormContent.includes("compact"),
      "subscribe-form.liquid must reference compact parameter"
    );
  });

  it("omits box/background classes when compact is true", () => {
    // The template should conditionally apply box and bg classes based on compact
    // Check that the compact parameter controls whether box/bg classes are applied
    const hasCompactConditional =
      /compact/.test(subscribeFormContent) &&
      (/unless\s+compact/.test(subscribeFormContent) ||
        /if\s+compact/.test(subscribeFormContent) ||
        /compact.*box/.test(subscribeFormContent) ||
        /box.*compact/.test(subscribeFormContent));

    assert.ok(
      hasCompactConditional,
      "subscribe-form.liquid must conditionally apply box/background classes based on compact parameter"
    );
  });

  it("passes compact: true from contact-options to subscribe-form", () => {
    const subscribeRender = contactOptionsContent.match(
      /render\s+"partials\/subscribe-form"[^%]*/
    );
    assert.ok(
      subscribeRender,
      "contact-options.liquid must render subscribe-form partial"
    );
    assert.ok(
      subscribeRender[0].includes("compact"),
      "contact-options.liquid must pass compact parameter to subscribe-form"
    );
  });
});
