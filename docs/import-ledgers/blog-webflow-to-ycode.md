# Webflow to YCode Import Ledger

## Scope
| Field | Value |
|---|---|
| Source project | Bauhem 2026 Webflow export |
| Target YCode project | YCode fork / Bauhem |
| Target page(s) | Blog static page (`112c0aec-6a9d-45c7-b3ca-b417ab41b5ab`) |
| DevLink path | `webflow/hero/HeroBlogHub.tsx`, `webflow/listing/ListingBlogAll.tsx`, `webflow/cards/CardPostItem.tsx` |
| Static export path | `bauhem-2026/blog.html` |
| Started by | OpenCode |
| Last updated | 2026-05-25 |

## Source Files
| Type | Path | Status | Notes |
|---|---|---|---|
| DevLink main component | `webflow/hero/HeroBlogHub.tsx` | done | Center banner: label, H1, paragraph. |
| DevLink main component | `webflow/listing/ListingBlogAll.tsx` | done | Contains a Webflow Collection List; implemented as a native YCode CMS list. |
| DevLink sub-component | `webflow/cards/CardPostItem.tsx` | done | Blog card structure: image, category pill, date/label, title, description, read-more link. |
| DevLink sub-component | `webflow/label/Label.tsx` | done | Reused label pattern. |
| DevLink sub-component | `webflow/buttons/LinkWithArrow.tsx` | done | Reused link-arrow pattern. |
| Static HTML | `bauhem-2026/blog.html` | done | Static page order: navbar, hero, blog collection, CTA v1, footer. |
| Variables CSS | `webflow/css/variables.css` | done | Inter, creamy white, black, primary red, paragraph, stroke, white. |
| Classes CSS | `webflow/css/classes.css` | done | Exact class styles for hero, blog grid, post cards, CTA, footer. |
| Static CSS | `bauhem-2026/css/bauhem-2026-54564a.webflow.css` | done | Browser-exported CSS confirms class values and breakpoints. |

## Inferred Design System
| Type | Source token/class | Source value | YCode target | Status | Notes |
|---|---|---|---|---|---|
| Color | `--creamy-white` | `#eae9e6` | existing Creamy White variable | done | Matches existing YCode Bauhem system. |
| Color | `--primary` | `#d0311e` | existing Primary variable | done | Used for labels/hover states. |
| Color | `--black` | `#000` | existing Black variable | done | Main text and links. |
| Color | `--paragraph` | `#676767` | existing Paragraph variable | done | Body/card descriptions. |
| Color | `--white` | `#fff` | existing White variable | done | Card backgrounds when needed. |
| Typography | `Inter` | 300-700 | existing Inter font | done | Site already uses Inter. |
| Spacing | `.section.center-banner` | `160px 0 80px` | Hero Blog Hub section classes | done | Preserved Webflow center-banner spacing with mobile reductions. |
| Grid | `.collection-list-services-grid-main` | 3 columns, 40px gap; 2 columns tablet; 1 mobile | Listing Blog All native collection grid | done | CMS-backed native collection list. |
| Radius | `--radius-small` | `10px` | Blog image/card radius | done | Matched card image radius and hover zoom. |

## CMS Mapping
| Source list/model | YCode collection | Fields | Status | Notes |
|---|---|---|---|---|
| Blog Posts collection list | `Blog Posts` (`9a7e44dd-48c8-4cbe-b153-9b84ce9447c9`) | title, description, image, category, slug, date, author | done | Native collection item template sorts by Date descending. |
| Blog category reference | `Blog Categories` (`348ad14e-d03e-4679-805f-f19c3f2744d8`) | name | done | Category pill uses related category name through relationship binding. |

## Assets
| Source asset | YCode asset ID | Usage | Status | Notes |
|---|---|---|---|---|
| `Arrow Black.svg` | `18015f47-b893-4124-9d8a-9d3281ab07da` | Read-more arrow | done | Existing asset reused. |
| Blog post images | CMS `Blog Posts.image` | Card image | done | Draft-only missing image values filled from existing `blog-*.webp` assets. |
| CTA image | `ddfaa6c0-d5f8-4a04-a782-f3cb092c9cde` | CTA Version 1 | done | Existing CTA component reused. |

## Components
| Source component/section | Native YCode target | Reuse/Create | YCode ID | Status | Notes |
|---|---|---|---|---|---|
| Navbar | Navbar Light Native | Reuse | `941add24-ad6c-4dac-b713-957884d7acc0` | done | Existing validated navbar. |
| `HeroBlogHub` | Hero Blog Hub | Update existing | `9b63b220-4467-448e-9551-eb6e29333358` | done | Rebuilt as centered native banner with label, H1, and paragraph. |
| `ListingBlogAll` + `CardPostItem` | Listing Blog All | Update existing | `1b920fb2-e7a1-471b-8083-48cbb66e3459` | done | Static cards replaced with native CMS collection list and `CardPostItem` structure. |
| `CtaV1` static section | CTA Version 1 | Reuse | `15c55287-564b-47f0-935a-9295b6c3e16b` | done | Blog page now uses CTA Version 1. |
| Footer | Footer | Reuse | `fd67c883-56ef-441e-b200-da77bb37eb92` | done | Existing validated footer. |

## Page Composition
| Section order | Source section | YCode component/layers | Status | Notes |
|---|---|---|---|---|
| 1 | Navbar | `Navbar Light Native` | done | Reuse. |
| 2 | Blog hero | `Hero Blog Hub` | done | Centered banner. |
| 3 | Blog posts collection | `Listing Blog All` | done | CMS-backed collection grid. |
| 4 | CTA | `CTA Version 1` | done | Replaced previous CTA Version 2 instance. |
| 5 | Footer | `Footer` | done | Reuse. |

## Interactions
| Source interaction | Native YCode approach | Status | Notes |
|---|---|---|---|
| Link arrow hover | Tailwind `group-hover:rotate-[-45deg]` and line scale | done | No custom JS. |
| Blog image hover zoom | Tailwind `group-hover:scale-[1.1]` | done | Native classes. |
| Scroll reveal | Omitted | skipped | Existing YCode pages do not rely on Webflow IX for imported sections. |

## QA
| Check | Status | Evidence | Notes |
|---|---|---|---|
| Desktop visual comparison | done | `blog-preview-desktop-final.png` | 1440px preview: 3-column CMS grid, no overflow. |
| Tablet visual comparison | done | `blog-preview-tablet-final.png` | 834px preview: 2-column CMS grid, no overflow. |
| Mobile visual comparison | done | `blog-preview-mobile-final.png` | 390px preview: 1-column CMS grid, no overflow. |
| No horizontal overflow | done | Playwright metrics | Desktop `scrollWidth 1425 <= width 1440`; tablet `819 <= 834`; mobile `scrollWidth 390 = width 390`. |
| CMS renders real data | done | Playwright metrics | 5 cards, 5 titles, category/date/title/description/image bindings render. |
| Links resolve correctly | done | DOM inspection | Card links resolve from CMS slug field (for example `/insights/ia-generative-conseil-strategie-digitale`). Detail templates are intentionally not imported yet. |
| Components editable in Builder | done | SQL validation | Components have synced `layers` and `variants[0].layers`; no direct `variables.text.type = field` bindings. |
| Known differences documented | done | This ledger | Blog card copy/content uses Bauhem CMS data instead of empty Webflow placeholder data. |

## Localization
| Scope | Primary FR default | EN draft translation | Status | Notes |
|---|---|---|---|---|
| `Hero Blog Hub` | `Analyses, mises à jour et conseils pratiques`; French paragraph | Webflow source copy restored for EN | done | YCode primary locale is French, so component defaults must be French even when Webflow source is English. |
| `Listing Blog All` static CTA text | `Lire l'article` | `Read more` | done | Date display changed to numeric `date-eu` to avoid English month names in FR default. |
| Blog CMS titles/descriptions | French CMS item values | Not translated in this pass | pending | If `/en/blog` must show English post titles/descriptions/categories, translate visible Blog CMS fields separately with `source_type: "cms"`. |
