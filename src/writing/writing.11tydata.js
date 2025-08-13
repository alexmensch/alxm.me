export default {
  eleventyComputed: {
    date: (data) => data.post.date,
    version_date: (data) => data.post.version_date,
    ogData: (data) => ({
      date: data.post.date,
      title: data.post.title,
    }),
  },
};