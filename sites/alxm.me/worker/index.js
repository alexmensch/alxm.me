import { createFetchHandler } from "@alxm/cf-worker";

// alxm.me serves an RSS feed (env.RSS_PATH / env.RSS_LAST_MODIFIED), so RSS
// handling is enabled. R2 path prefixes come from env.R2_PATHS.
export default createFetchHandler({ rss: true });
