/**
 * Tag Validation Plugin
 *
 * Validates that every article in the writing collection has exactly one tag
 * and that every tag has a corresponding entry in tagPhrases.
 *
 * Exports a testable validateWritingTags function. The plugin hooks into
 * Eleventy's collection resolution to run validation after the writing
 * collection is available.
 */

export function validateWritingTags(collection, tagPhrases) {
  if (!collection || collection.length === 0) {
    return;
  }

  const errors = [];

  for (const item of collection) {
    const title = item.title || item.data?.title || "unknown";
    const tag = item.tag || item.data?.tag;

    if (!tag) {
      errors.push(`"${title}": missing tag`);
      continue;
    }

    if (typeof tag !== "string") {
      errors.push(`"${title}": tag must be a string, got ${typeof tag}`);
      continue;
    }

    if (!tagPhrases[tag]) {
      errors.push(`"${title}": tag "${tag}" has no entry in tagPhrases.js`);
    }
  }

  if (errors.length > 0) {
    console.error("\nWriting tag validation failed:");
    errors.forEach((e) => console.error(`  ${e}`));
    console.error(
      "\nEnsure every writing article has exactly one tag and that tagPhrases.js has an entry for it.\n"
    );
    throw new Error("Writing tag validation failed");
  }

  console.log(
    `[tag-validation] All ${collection.length} writing articles have valid tags`
  );
}

export default function tagValidationPlugin(eleventyConfig, { tagPhrases }) {
  // Validation is triggered from the tag archive pagination `before` callback
  // which receives the writing collection. We store tagPhrases in global data
  // so it's accessible from the data file.
  eleventyConfig.addGlobalData("tagPhrasesMap", () => tagPhrases);
}
