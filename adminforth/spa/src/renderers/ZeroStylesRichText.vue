<template>
    <iframe ref="iframeRef" class="zero-styles-iframe" />
  </template>
  
  <script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common'
  import sanitizeHtml from 'sanitize-html';
  
  const props = defineProps<{
    column: AdminForthResourceColumnCommon
    record: any
    meta: any
    resource: AdminForthResourceCommon
    adminUser: AdminUser
  }>()
  
  const iframeRef = ref<HTMLIFrameElement | null>(null)
  
  const renderHtml = () => {
    const iframe = iframeRef.value
    if (!iframe) return
  
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
  
    iframe.style.border = "none"
    iframe.style.width = "100%"
    iframe.style.height = "400px"
  
    doc.open()
    doc.write(protectAgainstXSS(props.record[props.column.name]) || '')
    doc.close()
  }

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

  onMounted(renderHtml)
  watch(() => props.record[props.column.name], renderHtml)
  </script>
  
  <style scoped>
  .zero-styles-iframe {
    width: 100%;
    border: none;
  }
  </style>
  