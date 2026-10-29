import { OG_WIDTH, OG_HEIGHT } from "@alxm/og-image";

const site = {
  domain: "alexmarshalltherapy.com",
  authorName: "Alex Marshall",
  authorRole: "Therapeutic Counselling",
  authorEmail: "hello@alexmarshalltherapy.com",
  siteName: "Alex Marshall Therapy",
  links: [],
  nav: [
    { title: "Writing", url: "/writing/" },
    { title: "Contact", url: "/contact/" }
  ]
};

// Open Graph preview cards. `defaultImage` is the committed static fallback;
// pages whose og:image resolves under `generatedDir` get a card rendered for
// them at build time (see the eleventy.after hook in .eleventy.js). width/height
// come from @alxm/og-image so the og:image:width/height meta tags always match
// the rendered card and can't drift.
site.og = {
  defaultImage: "/assets/images/og/default.png",
  generatedDir: "/assets/images/og/auto",
  width: OG_WIDTH,
  height: OG_HEIGHT
};

// Atom feed for the writing collection. Only items whose tags intersect
// site.counsellingTags are included (see writing-atom-feed.11tydata.js) —
// the feed mirrors what the writing listing page renders.
site.rss = {
  collection: "writing",
  title: "Alex Marshall Therapy | Writing",
  subtitle:
    "Writing by Alex Marshall on psychology, personal growth, and the inner journey of meaningful change."
};
site.rss.outputPath = `/${site.rss.collection}.atom`;

site.links = [
  {
    rel: "icon",
    href: "/favicon.svg",
    type: "image/svg+xml"
  },
  {
    rel: "icon",
    href: "/favicon.ico",
    sizes: "32x32"
  },
  {
    rel: "apple-touch-icon",
    href: "/apple-touch-icon.png"
  },
  {
    rel: "manifest",
    href: "/site.webmanifest"
  },
  {
    rel: "alternate",
    title: site.rss.title,
    type: "application/atom+xml",
    href: site.rss.outputPath
  },
  {
    rel: "preconnect",
    href: "https://rsms.me"
  },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com"
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossorigin: ""
  },
  {
    rel: "stylesheet",
    href: "/assets/css/root.css"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap",
    lazy: true
  },
  {
    rel: "stylesheet",
    href: "https://rsms.me/inter/inter.css",
    lazy: true
  }
];

site.newsletter = {
  apiUrl: "https://newsletter.alxm.me",
  channelId: "alexmarshalltherapy-com"
};

// Tags this site owns canonically. An article is rendered here as a full
// self-canonical page iff its tags intersect this set; everything else is
// skipped. Both sites hold the same value and apply identical membership
// semantics, differing only in the render branch.
site.counsellingTags = ["psychology"];

site.company = {
  name: "Thoughtful Design Ltd",
  number: "15642102",
  vat: "GB465435281",
  address: {
    street: "82A James Carter Road",
    locality: "Mildenhall",
    region: "England",
    postalCode: "IP28 7DE",
    country: "GB"
  }
};

export default site;
