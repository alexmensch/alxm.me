export default {
  // For metadata that needs to be preserved as objects.
  // Guards against missing `post` because this data file applies to all
  // templates under src/writing/, including tags.liquid which has no `post`.
  eleventyComputed: {
    date: (data) => data.post?.date,
    version_date: (data) => data.post?.version_date,
    meta: (data) => data.post?.meta,
    tags: (data) => data.post?.tags || [],
    ogData: (data) =>
      data.post
        ? {
            date: data.post.date,
            title: data.post.title
          }
        : undefined
  }
};
