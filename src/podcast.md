---
layout: layouts/podcast
title: "Podcast: What I Knew"
meta:
  description: "What I Knew — a podcast celebrating the courage it takes to make big personal changes. Stories of transformation told with candor and vulnerability."
hero:
  header: "What I Knew: Stories of courage in personal change"
---

{%- assign space = " " -%}

_What I Knew_ celebrates the courage that it takes to make big personal changes. My guests tell their stories with candor and vulnerability, giving light to the inner conflict, complexity, and mystery faced in navigating what it means to live a life with purpose. From career changes, to mental health challenges, to spiritual journeys, each of them share insights and moments that any of us can both relate to and learn from.

The show is available on
{% for link in site.podcastURL.remotes %}
{%- if forloop.length == 1 -%}
<a href="{{ link.url }}">{{ link.name }}</a>
{%- elsif forloop.length == 2 -%}
{%- if forloop.first -%}
<a href="{{ link.url }}">{{ link.name }}</a> and{{ space }}
{%- else -%}
<a href="{{ link.url }}">{{ link.name }}</a>
{%- endif -%}
{%- else -%}
{%- if forloop.last -%}
and <a href="{{ link.url }}">{{ link.name }}</a>
{%- else -%}
<a href="{{ link.url }}">{{ link.name }}</a>,{{ space }}
{%- endif -%}
{%- endif -%}
{%- endfor -%}
, or you can subscribe directly via the [RSS feed]({{ site.podcastURL.local }}).
