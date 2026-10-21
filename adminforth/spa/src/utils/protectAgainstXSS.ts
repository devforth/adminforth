import DOMPurify from 'dompurify';

// only the rich text renderers import this module, so dompurify lands in their lazy chunks; re-exporting it from
// utils/index.ts would put dompurify back into the first screen, it runs code when its module loads
export function protectAgainstXSS(value: string) {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [
      "address","article","aside","footer","header","h1","h2","h3","h4",
      "h5","h6","hgroup","main","nav","section","blockquote","dd","div",
      "dl","dt","figcaption","figure","hr","li","ol","p","pre",
      "ul","a","abbr","b","bdi","bdo","br","cite","code","data","dfn",
      "em","i","kbd","mark","q","rb","rp","rt","rtc","ruby","s","samp",
      "small","span","strong","sub","sup","time","u","var","wbr","caption",
      "col","colgroup","table","tbody","td","tfoot","th","thead","tr",
      "img","video","source"
    ],
    ALLOWED_ATTR: [
      "data-list",
      "src","srcset","alt","title","width","height","loading",
      "controls","autoplay","loop","muted","poster","playsinline","type",
      "class","style"
    ],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true
  });
}
