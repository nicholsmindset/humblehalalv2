import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/signup',
        '/dashboard',
        '/admin',
        '/api/',
        '/auth/',
        '/business/dashboard',
      ],
    },
    sitemap: 'https://humblehalal.sg/sitemap.xml',
  }
}
