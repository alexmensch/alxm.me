import { getAudioDurationInSeconds } from "get-audio-duration";
import { stat } from "fs/promises";
import { md } from "./helpers.js";

export default {
  markdownToCDATA: function (markdownContent) {
    if (!markdownContent || typeof markdownContent !== "string") {
      return "<![CDATA[]]>";
    }

    const htmlContent = md.render(markdownContent);
    // Handle potential CDATA conflicts by escaping any existing ]]> sequences
    const escapedContent = htmlContent.replace(/\]\]>/g, "]]]]><![CDATA[>");

    return `<![CDATA[${escapedContent}]]>`;
  },
  getDurationInSec: async function (filename) {
    const duration = await getAudioDurationInSeconds(filename);
    return duration;
  },
  getFilesize: async function (filename) {
    const stats = await stat(filename);
    return stats.size;
  },
};
