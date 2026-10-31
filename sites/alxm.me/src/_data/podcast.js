import { makeMarkdownLib } from "@alxm/eleventy-config/markdown";
import site from "./site.js";

const markdownLib = makeMarkdownLib({ domain: site.domain });

export default {
  markdownToCDATA(markdownContent) {
    if (!markdownContent || typeof markdownContent !== "string") {
      return "<![CDATA[]]>";
    }

    const htmlContent = markdownLib.render(markdownContent);
    // Handle potential CDATA conflicts by escaping any existing ]]> sequences
    const escapedContent = htmlContent.replace(/\]\]>/g, "]]]]><![CDATA[>");

    return `<![CDATA[${escapedContent}]]>`;
  }
};
