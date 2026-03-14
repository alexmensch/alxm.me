/**
 * Tag-to-phrase mapping for writing categories.
 *
 * Each key is a tag slug (matching the `tag` frontmatter field on writing
 * articles). The value is a phrase template where `{tag}` is replaced at
 * render time with the title-cased, linked tag name.
 *
 * Build-time validation ensures every article tag has an entry here.
 * Add new entries as new tags are introduced.
 */
const tagPhrases = {
  technology: "From the department of {tag}",
  leadership: "From the annals of {tag}",
  culture: "Dispatches from the world of {tag}",
  psychology: "From the notebooks on {tag}",
  business: "From the ledgers of {tag}",
  design: "From the studio of {tag}",
  ai: "From the frontiers of {tag}",
  politics: "From the corridors of {tag}",
  science: "From the laboratory of {tag}",
  philosophy: "From the margins of {tag}",
  health: "From the practice of {tag}",
  education: "From the lecture halls of {tag}",
  travel: "From the dispatches on {tag}",
  writing: "From the workshop of {tag}",
  music: "From the conservatory of {tag}",
  film: "From the reels of {tag}",
  books: "From the stacks on {tag}",
  personal: "From the department of {tag}",
  creativity: "From the atelier of {tag}",
  communication: "From the annals of {tag}",
  counselling: "From the practice of {tag}",
  management: "From the department of {tag}",
  coaching: "From the practice of {tag}",
  startups: "From the annals of {tag}",
  productivity: "From the department of {tag}",
  strategy: "From the war room of {tag}",
  growth: "From the department of {tag}",
  sustainability: "From the department of {tag}",
  economics: "From the ledgers of {tag}"
};

export default tagPhrases;
