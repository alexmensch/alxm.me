import { createFetchHandler } from "@alxm/cf-worker";

// alexmarshalltherapy.com has no RSS feed, so RSS handling is disabled. R2
// path prefixes come from env.R2_PATHS.
export default createFetchHandler({ rss: false });
