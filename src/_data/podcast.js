import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: true,        // Enable HTML tags in source
  xhtmlOut: true,    // Use '/' to close single tags (<br />)
  breaks: false,     // Convert '\n' in paragraphs into <br>
  linkify: true      // Autoconvert URL-like text to links
});

export default {
  markdownToCDATA: function (markdownContent) {
    if (!markdownContent || typeof markdownContent !== 'string') {
      return '<![CDATA[]]>';
    }

    // Convert Markdown to HTML
    const htmlContent = md.render(markdownContent);
    
    // Handle potential CDATA conflicts by escaping any existing ]]> sequences
    const escapedContent = htmlContent.replace(/\]\]>/g, ']]]]><![CDATA[>');
    
    // Wrap in CDATA
    return `<![CDATA[${escapedContent}]]>`;
  },
};
