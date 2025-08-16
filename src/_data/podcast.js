import { getAudioDurationInSeconds } from "get-audio-duration";
import { stat } from "fs/promises";
import helpers from "./helpers.js";

export default {
  markdownToCDATA(markdownContent) {
    if (!markdownContent || typeof markdownContent !== "string") {
      return "<![CDATA[]]>";
    }

    const htmlContent = helpers.md.render(markdownContent);
    // Handle potential CDATA conflicts by escaping any existing ]]> sequences
    const escapedContent = htmlContent.replace(/\]\]>/g, "]]]]><![CDATA[>");

    return `<![CDATA[${escapedContent}]]>`;
  },
  async getDurationInSec(filename) {
    const duration = await getAudioDurationInSeconds(filename);
    return duration;
  },
  async getFilesize(filename) {
    const stats = await stat(filename);
    return stats.size;
  }
};
