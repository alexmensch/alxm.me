/**
 * Tag Validation
 *
 * Validates that every article in the writing collection has exactly one tag
 * and that every tag has a corresponding entry in tagPhrases.
 *
 * Called from the tag archive pagination `before` callback in
 * src/writing/tags.11tydata.js, which runs after the writing collection
 * is populated by the KV plugin.
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
