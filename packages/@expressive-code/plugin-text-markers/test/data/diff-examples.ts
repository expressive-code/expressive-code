export const jsCodeWithDiffMarkers = `
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import lit from '@astrojs/lit';

export default defineConfig({
-  integrations: [vue(), lit()]
+  integrations: [lit(), vue()]
});
`.trim()

export const indentedJsCodeWithDiffMarkers = `
  import { defineConfig } from 'astro/config';
  import vue from '@astrojs/vue';
  import lit from '@astrojs/lit';

  export default defineConfig({
-   integrations: [vue(), lit()]
+   integrations: [lit(), vue()]
  });
`.replace(/^\n|\s+$/g, '')

export const actualDiff = `
// some-diff.txt
*** file1.txt   Thu Jan 11 08:52:37 2018
--- file2.txt   Thu Jan 11 08:53:01 2018
***************
*** 1,4 ****
  cat
- mv
- comm
  cp
--- 1,4 ----
  cat
  cp
+ diff
+ comm
`.trim()
