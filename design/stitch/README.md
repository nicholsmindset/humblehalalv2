# HumbleHalal Design System — Stitch Reference

This directory stores Stitch HTML exports (design source of truth). **Never delete files here.**

## Design Tokens

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#047857` | Emerald — brand primary, MUIS badge, icons, borders |
| `accent` | `#D4A017` | Gold — "Halal" wordmark, CTAs, highlights |
| `charcoal` | `#1C1917` | Dark text, footer background |
| `warm-white` | `#FAFAF8` | Page backgrounds |
| `background-dark` | `#0f231d` | Hero dark sections |

### Typography
| Role | Font | Weights | Notes |
|------|------|---------|-------|
| All body/UI/buttons/nav | **Manrope** | 400, 500, 600, 700, 800 | Default `font-sans` |
| Accent words ("Halal" in logo, section titles) | **Playfair Display** | 400 italic ONLY | `font-display italic` |

### Icons
Google Material Symbols Outlined. Usage:
```html
<span class="material-symbols-outlined text-primary">mosque</span>
```

### Component Patterns

**Navbar:**
```
fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-primary/10
```

**Cards:**
```
bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all
```

**MUIS Badge:**
```
bg-primary text-white text-xs font-bold px-3 py-1 rounded-full
```

**Gold CTA Button:**
```
bg-accent text-charcoal rounded-lg font-bold hover:bg-accent/90
```

**Islamic Pattern (CSS utility):**
```css
.islamic-pattern {
  background-image: radial-gradient(#D4A017 0.5px, transparent 0.5px);
  background-size: 24px 24px;
  opacity: 0.1;
}
```

**Frosted Glass (CSS utility):**
```css
.frosted-glass {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
}
```
