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
  }
};
