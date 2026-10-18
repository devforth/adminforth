// URLs of the 4:3 flags of flag-icons: only the URLs get into the bundle, the browser downloads the SVG of a flag when it is shown.
// no-inline keeps small flags from being inlined as data URIs, exhaustive lets the glob into node_modules
const flagUrls = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
  exhaustive: true,
});

export default function getFlagUrl(countryCode: string): string | undefined {
  return flagUrls[`/node_modules/flag-icons/flags/4x3/${countryCode.toLowerCase()}.svg`];
}
