import type { MuslimBadge, MuslimEnrichment } from '@/lib/liteapi/enrich'
import { formatDistance } from '@/lib/liteapi/enrich'

const BADGE_CONFIG: Record<MuslimBadge, { label: string; icon: string; title: string }> = {
  mosque_nearby: { label: 'Mosque Nearby', icon: '🕌', title: 'Mosque within 500m' },
  halal_food_area: { label: 'Halal Food Area', icon: '🍽', title: '5+ halal restaurants within 1km' },
  prayer_room: { label: 'Prayer Room', icon: '🙏', title: 'Hotel has a prayer room' },
  halal_breakfast: { label: 'Halal Breakfast', icon: '☪️', title: 'Halal breakfast available' },
  muslim_friendly: { label: 'Muslim-Friendly', icon: '⭐', title: 'Muslim-friendly score ≥ 4/5' },
}

interface Props {
  enrichment: MuslimEnrichment
  compact?: boolean
}

export function MuslimBadges({ enrichment, compact = false }: Props) {
  if (!enrichment.badges.length) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {enrichment.badges.map((badge) => {
        const cfg = BADGE_CONFIG[badge]
        return (
          <span
            key={badge}
            title={cfg.title}
            className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-primary border border-primary/20 ${
              compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
            }`}
          >
            <span>{cfg.icon}</span>
            {!compact && <span>{cfg.label}</span>}
          </span>
        )
      })}
      {!compact && enrichment.nearestMosqueName && enrichment.nearestMosqueDistanceM !== null && (
        <span className="text-xs text-charcoal/50 self-center ml-0.5">
          {enrichment.nearestMosqueName} · {formatDistance(enrichment.nearestMosqueDistanceM)}
        </span>
      )}
    </div>
  )
}
