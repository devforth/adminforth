<template>
    <iframe ref="iframeRef" class="zero-styles-iframe" />
  </template>
  
  <script setup lang="ts">
  import { nextTick, onMounted, ref, watch } from 'vue'
  import type { AdminForthResourceColumnCommon, AdminForthResourceCommon, AdminUser } from '@/types/Common'
  import { protectAgainstXSS } from '@/utils'
  
  const props = defineProps<{
    column: AdminForthResourceColumnCommon
    record: any
    meta: any
    resource: AdminForthResourceCommon
    adminUser: AdminUser
  }>()
  
  const iframeRef = ref<HTMLIFrameElement | null>(null)
  
  const renderHtml = async () => {
    const iframe = iframeRef.value
    if (!iframe) return
  
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
  
    iframe.style.border = "none"
    iframe.style.width = "100%"
  
    doc.open()
    doc.write(protectAgainstXSS(props.record[props.column.name]) || '')
    doc.close()

    await nextTick()

    iframe.onload = () => {
      try {
        const iframeBody = iframe.contentWindow?.document.body
        if (iframeBody) {
          iframe.style.height = iframeBody.scrollHeight + 'px'
        }
      } catch (e) {
        console.warn("Can't auto-resize iframe:", e)
      }
    }
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
  