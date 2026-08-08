export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot'],
        allow: '/',
      },
    ],
    sitemap: 'https://edu.imp3rial.dev/sitemap.xml',
  }
}
