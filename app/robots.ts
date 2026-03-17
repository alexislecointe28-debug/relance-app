import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/signup', '/login', '/legal'],
        disallow: ['/dashboard', '/dossiers', '/admin', '/parametres', '/import', '/equipe', '/agenda', '/parrainage'],
      },
    ],
    sitemap: 'https://www.paynelope.com/sitemap.xml',
  }
}
