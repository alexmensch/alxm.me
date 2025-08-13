export default {
  eleventyComputed: {
    date: (data) => data.stub.date,
    hero: (data) => data.stub.hero,
    ogData: (data) => ({
      date: data.stub.date,
      title: data.stub.title,
    }),
  },
};