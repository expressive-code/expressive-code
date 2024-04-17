export const lineMarkerTestCode = `
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    extendDefaultPlugins: false,
    smartypants: false,
    gfm: false,
  }
});
`.trim()

export const inlineMarkerTestCode = `
---
const { greeting = "Hello", name = "Astronaut" } = Astro.props;
---
<h2>{greeting}, punymighty {name}!</h2>
`.trim()

export const complexDiffTestCode = `
---
layout: ../../layouts/BaseLayout.astro
title: 'My first MDX post'
+publishDate: '21 September 2022'
---
import BaseLayout from '../../layouts/BaseLayout.astro';

export function fancyJsHelper() {
  return "Try doing that with YAML!";
}

<BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>
  Welcome to my new Astro blog, using MDX!
</BaseLayout>
`.trim()

export const complexDiffTestMeta = `lang="mdx" title="src/pages/posts/first-post.mdx" ins={"\\":6} mark={"'":8-10} del={2} /</?BaseLayout>/ /</?BaseLayout title={frontmatter.title} fancyJsHelper={fancyJsHelper}>/`
