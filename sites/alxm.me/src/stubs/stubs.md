---
layout: layouts/landing
meta:
  noindex: true
pagination:
  data: collections.stubs
  size: 1
  alias: stub
eleventyComputed:
  title: "{{ stub.title }}"
  permalink: "{{ stub.permalink }}"
---

{{ stub.content | renderContent: "liquid" }}
