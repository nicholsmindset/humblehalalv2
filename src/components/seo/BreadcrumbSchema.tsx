import { SITE_URL } from '@/config'

export interface BreadcrumbItem {
  name: string
  href?: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const itemListElement = items.map((item, i) => ({
    '@type': 'ListItem' as const,
    position: i + 1,
    name: item.name,
    ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
  }))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement,
        }),
      }}
    />
  )
}
