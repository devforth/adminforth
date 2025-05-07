<template>
  <div class="rich-text" v-html="htmlContent"></div>
</template>

<script setup lang="ts">
import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common'
import { protectAgainstXSS } from '@/components/ValueRenderer.vue' // путь замени на актуальный
import sanitizeHtml from 'sanitize-html';

const props = defineProps<{
  column: AdminForthResourceColumnCommon
  record: any
  meta: any
  resource: AdminForthResourceCommon
  adminUser: AdminUser
}>()
function protectAgainstXSS(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
      "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
      "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
      "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
      "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
      "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
      "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", 'img'
    ],
    allowedAttributes: {
      'li': [ 'data-list' ],
      'img': [ 'src', 'srcset', 'alt', 'title', 'width', 'height', 'loading' ]
    } 
  });
}
const htmlContent = protectAgainstXSS(props.record[props.column.name])

</script>

<style scoped>
.rich-text {
   /* You can add default styles here if needed */
  word-break: break-word;
}
</style>