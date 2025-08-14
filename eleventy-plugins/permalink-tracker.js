import fs from "fs";
import path from "path";

export default function permalinkTrackerPlugin(eleventyConfig) {
  let collectedPermalinks = new Set();

  eleventyConfig.addTransform(
    "collectPermalinks",
    function (content, outputPath) {
      if (outputPath) {
        let permalink = outputPath.replace(/^.*\/_site/, "");
        if (!permalink.startsWith("/")) {
          permalink = "/" + permalink;
        }

        if (outputPath.endsWith(".html")) {
          permalink = permalink.replace(/\/index\.html$/, "/");
          if (permalink.endsWith(".html") && permalink !== "/") {
            permalink = permalink.replace(/\.html$/, "");
          }
        }

        collectedPermalinks.add(permalink);
      }
      return content;
    },
  );

  eleventyConfig.on("eleventy.after", async () => {
    const sortedPermalinks = Array.from(collectedPermalinks).sort();

    const permalinksFile = path.join(process.cwd(), "permalinks.txt");
    const content = sortedPermalinks.join("\n") + "\n";

    fs.writeFileSync(permalinksFile, content, "utf8");
    console.log(
      `✅ Wrote ${sortedPermalinks.length} permalinks to permalinks.txt`,
    );
  });
}
