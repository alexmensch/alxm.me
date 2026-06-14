import slugify from "slugify";
import { DateTime } from "luxon";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />)
  breaks: false, // Convert '\n' in paragraphs into <br>
  linkify: true // Autoconvert URL-like text to links
});

const helpers = {
  md: markdown,
  currentYear() {
    return new Date().getFullYear().toString();
  },
  hasAnyTag(tags, allowed) {
    if (!Array.isArray(tags) || !Array.isArray(allowed)) return false;
    return tags.some((tag) => allowed.includes(tag));
  },
  permalinkToPath(title, date) {
    return `${this.toDate(date, "/")}/${this.toSlug(title)}/`;
  },
  permalinkToFilename(title, date) {
    return `${this.toDate(date, "-")}-${this.toSlug(title)}`;
  },
  permalinkToPage(title) {
    return `${this.toSlug(title)}`;
  },
  toSlug(string) {
    return slugify(string, {
      lower: true,
      replacement: "-",
      remove: /[*+~.()'"!:@]/g
    });
  },
  toDate(date, delim) {
    const formatString = ["yyyy", "LL", "dd"].join(delim);
    return DateTime.fromJSDate(date).toFormat(formatString);
  },
  dateToRFC2822(date) {
    return date.toUTCString();
  },
  dateToRFC339(date) {
    return date.toISOString();
  },
  getLinkActiveState(itemPath, pagePath) {
    let response = "";

    if (typeof pagePath !== "string") return "";

    if (itemPath === pagePath) {
      response = ' aria-current="page"';
    }

    if (itemPath.length > 1 && pagePath.indexOf(itemPath) === 0) {
      response += ' data-state="active"';
    }

    return response;
  },
  getPageTheme(pagePath, siteNav) {
    for (const item of siteNav) {
      if (pagePath.includes(item.url)) {
        return item.theme ?? null;
      }
    }
    return null;
  },
  getNewestCollectionItemDate(collection) {
    if (!collection || collection.length === 0) {
      throw new Error(`No items in collection "${collection}"`);
    }

    return collection.reduce(
      (newest, item) => {
        const itemDate = item.date || item.data?.date;
        return itemDate > newest ? itemDate : newest;
      },
      collection[0].date || collection[0].data?.date || new Date()
    );
  },
  markdownToHTML(content) {
    return String(markdown.render(content));
  },
  escapeHTML(string) {
    return String(string).replace(
      /[&<>'"]/g,
      (tag) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;"
        })[tag] || tag
    );
  }
};

export function makeHelpers() {
  return helpers;
}

export default helpers;
