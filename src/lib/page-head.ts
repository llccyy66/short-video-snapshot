export function pageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} · 智读 ZBILI` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} · 智读 ZBILI` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}