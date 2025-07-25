const site = {
  domain: "alxm.me",
  authorName: "Alex Marshall",
  authorEmail: "hello@alxm.me",
  siteName: "Alex Marshall",
  rss: {
    collection: "writing",
    title: "Alex Marshall | Writing",
    subtitle: "A collection of my writing on various topics.",
  },
  links: [],
  nav: [
    { title: "Coaching", url: "/coaching/" },
    { title: "Advisory", url: "/advisory/" },
    { title: "Writing", url: "/writing/", collection: true },
    { title: "Podcast", url: "/podcast/", collection: true, hidden: true },
    { title: "Contact", url: "/contact/", footer: true },
    { title: "About", url: "/about/", footer: true },
    { title: "Styles", url: "/styles/", hidden: true },
  ],
};

site.rss.outputPath = `/${site.rss.collection}.atom`;

site.links = [
  {
    rel: "preconnect",
    href: "https://rsms.me",
  },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossorigin: "",
  },
  {
    rel: "stylesheet",
    href: "/assets/css/root.css",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://rsms.me/inter/inter.css",
  },
  {
    rel: "stylesheet",
    href: "/assets/css/syntax.css",
  },
  {
    rel: "alternate",
    title: site.rss.title,
    type: "application/atom+xml",
    href: site.rss.outputPath,
  },
];

export default site;
