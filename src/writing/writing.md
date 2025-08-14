---
layout: layouts/posts
pagination:
  data: collections.writing
  size: 1
  alias: post
eleventyComputed:
  title: "{{ post.title }}"
  permalink: "{{ post.permalink }}"
---

{{ post.content | renderContent: "liquid" }}
