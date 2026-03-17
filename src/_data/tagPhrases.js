/**
 * Tag-to-phrase mapping for writing categories.
 *
 * Each key is a tag slug (matching values in the `tags` frontmatter array on
 * writing articles). The value is a phrase template where `{tag}` is replaced
 * at render time with the title-cased, linked tag name.
 *
 * Build-time validation ensures every article tag has an entry here.
 * Add new entries as new tags are introduced.
 */
const tagPhrases = {
  art: "Onward and upward with the {tag}s",
  aviation: "Annals of {tag}",
  essay: "{tag}",
  fiction: "{tag}",
  financial: "Annals of {tag} Life",
  nature: "Annals of {tag}",
  software: "Annals of {tag}",
  technology: "Annals of {tag}",
  psychology: "Annals of {tag}",
  travel: "{tag} Letters from Abroad",
  personal: "{tag} History"
};

export default tagPhrases;
