# Webflow to YCode Import Ledger: a-propos

## Scope
| Field | Value |
|---|---|
| Source project | bauhem-2026 Webflow export |
| Target YCode project | YCode local Bauhem site |
| Target page | `a-propos` (`63c9b84b-fe8b-4f0a-a2e4-de3d3126efdf`) |
| DevLink path | `webflow/hero/HeroSystems.tsx`, `webflow/sections/SectionSystem*.tsx`, `webflow/sections/CtaV3.tsx` |
| Static export path | `bauhem-2026/a-propos.html` |
| Started by | OpenCode |
| Last updated | 2026-05-25 |

## Source Files
| Type | Path | Status | Notes |
|---|---|---|---|
| Static HTML | `bauhem-2026/a-propos.html` | done | Source order: nav, hero, services overview, about/video, case/testimonial slider, team, brand promise, center CTA, footer. |
| Static CSS | `bauhem-2026/css/bauhem-2026-54564a.webflow.css` | done | Exact section/layout class values inspected for relevant sections. |
| Variables CSS | `webflow/css/variables.css` | done | Tokens mapped to existing YCode variables. |
| DevLink hero | `webflow/hero/HeroSystems.tsx` | done | Two-column hero with background video and marquee. |
| DevLink overview | `webflow/sections/SectionSystemOverview.tsx` | done | Contains a Webflow collection list; implemented as native YCode CMS list. |
| DevLink about | `webflow/sections/SectionSystemAboutUs.tsx` | done | Text/benefits plus video/stat card. |
| DevLink testimonials | `webflow/sections/SectionSystemTestimonials.tsx` | done | Contains collection-backed slider content; implemented as native YCode CMS + slider. |
| DevLink team | `webflow/sections/SectionSystemMeetTheTeam.tsx` | done | Contains collection-backed team list; reused native YCode team component. |
| DevLink brand promise | `webflow/sections/SectionSystemBrandPromise.tsx` | done | Existing native component available. |
| DevLink CTA | `webflow/sections/CtaV3.tsx` | done | Source resembles brand promise; current site also has approved CTA Version 1. |

## Inferred Design System
| Type | Source token/class | Source value | YCode target | Status | Notes |
|---|---|---|---|---|---|
| Color | `--primary` | `#d0311e` | `Primary` `dd5be44a-d986-4b5d-9b0f-d3fc7a36ca0a` | done | Existing variable. |
| Color | `--black` | `#000000` | `Black` `278bfea0-7517-41b4-a075-0bfcaab8788a` | done | Existing variable. |
| Color | `--creamy-white` | Webflow `hsla(45, 8.7%, 90.98%, 1)` / YCode `#f6f3f0` | `Creamy White` `62e73c6d-77ac-4737-b1d3-d42b0ea66531` | done | Use established YCode variable. |
| Color | `--paragraph` | `#676767` | `Paragraph` `8a37b278-7b96-48f9-b207-8ec52e6c360e` | done | Existing variable. |
| Color | `--stroke` | `#d8d6d2` | `Stroke` `081dc04c-c24a-4754-9aa1-2441c88393f8` | done | Existing variable. |
| Radius | `--radius-small` | `10px` | `rounded-[10px]` | done | Native Tailwind class. |
| Radius | `--radius-medium` | `50px` | `rounded-[50px]` | done | Used for primary buttons. |
| Typography | Section H2 | `38px`, `500`, `1em/1.2em`, tight tracking | Existing YCode component scale | in_progress | Preserve established native components where already accepted. |
| Layout | `.base-container` | `90%` centered | `w-[90%] max-w-[1440px] mx-auto` | done | Existing components use same pattern. |

## CMS Mapping
| Source list/model | YCode collection | Fields | Status | Notes |
|---|---|---|---|---|
| Services overview list | `Services` `645dd26d-dffe-4673-9473-13d34e80fded` | `Title` `7b5d3470-e1ca-486e-9039-1864fc6ec3ae`, `Description` `37cf41e0-f3a3-40a4-953b-ba158cc1faf1`, `Image` `673a9db0-6e34-435b-be1e-30ccf99a5038`, `Slug` `1da7e8d8-4552-4569-946d-21dcc9fe4ae8` | done | Reuse existing native CMS-backed component. |
| Team list | `Team Members` `32d09189-f611-43bd-bbda-70ebffa77a4f` | `Name` `3d73bc71-9305-44e7-af1b-59efdf63adff`, `Job Title` `ea7d05c1-eb64-4d48-95c2-acc0cd2bacab`, `Image` `ad5b1a47-c7b1-43cc-a424-b0d9c3545e35`, `Description` `29a6a09c-6e88-485e-a4bc-bbe2150af179` | done | Reuse `SectionTeamGrid`. |
| Case/testimonial slider | `Testimonials` `76af650d-e9ed-4d37-9504-e0a2d5c87bc9` | author/job/review/stat fields | done | `Section System Testimonials` uses a native YCode slider backed by this collection. |
| Case studies | `Case Studies` `e6b12804-5deb-4a2c-85fc-afecaaf5e0a4` | title/description/image/client/focus/content/date | skipped | Not imported into this static page because existing native testimonial slider maps better to available component and data. |

## Assets
| Source asset | YCode asset ID | Usage | Status | Notes |
|---|---|---|---|---|
| `Arrow-Black.svg` | `18015f47-b893-4124-9d8a-9d3281ab07da` | Links/arrows | done | Existing asset. |
| `bauhem-reel` | `2704307f-4adc-4ed1-9e97-dfe0adfd1b8c` | Native video blocks | done | Existing video asset. |
| `cta-version-1-background` | `ddfaa6c0-d5f8-4a04-a782-f3cb092c9cde` | CTA Version 1 image | done | Existing asset. |
| `guillaume-gosselin` | `722cde50-6585-4255-a7b7-c7a098d53799` | Team member image | done | Existing asset. |

## Components
| Source component/section | Native YCode target | Reuse/Create | YCode ID | Status | Notes |
|---|---|---|---|---|---|
| Navbar | `Navbar Light Native` | reuse | `941add24-ad6c-4dac-b713-957884d7acc0` | done | Already on page. |
| `HeroSystems` | `Hero Systems` | create | `914e14e7-5303-4987-b822-a268d8659a4b` | done | Rebuilt against `section.banner-about`; uses `bauhem-reel`, overlays, marquee, and responsive hero video CSS override. |
| `SectionSystemOverview` | `Section System Overview` | create | `6eff9962-6cac-4899-893a-ea4856ada873` | done | Native Services collection list with source-like grid/card structure. Collection item wrapper span classes removed on 2026-05-25 so CMS items flow into the parent 3-column grid. |
| `SectionSystemAboutUs` | `Section System About Us` | create | `24cab0cd-1970-43e6-9f12-c73af9ef0ca5` | done | Rejected `Section System About Native` (`dcc3ca7f-2c6d-4962-b4aa-1d49872baf51`) deleted; inline remnant removed from page. |
| `SectionSystemTestimonials` | `Section System Testimonials` | create | `7c7d2636-fdaa-4c3f-8279-f28a9197bc22` | done | Native YCode `slider` bound to Testimonials collection. Renamed from the earlier cases component. |
| `SectionSystemMeetTheTeam` | `SectionTeamGrid` | reuse | `872ffea2-562f-4d38-a632-1d5f809673a8` | done | Existing native Team Members collection component reused. Earlier draft-only team component `d9969e94-e115-4066-bf41-adb4c000a3d1` marked deleted. |
| `SectionSystemBrandPromise` | `Section System Brand Promise` | create | `fce55ee3-5514-4564-98eb-042cac18cbb5` | done | Native video, red block, CTA button, and marquee text. |
| `CtaV3` / center CTA | `CTA Version 1` | reuse | `15c55287-564b-47f0-935a-9295b6c3e16b` | done | Existing CTA reused per direction. Earlier draft-only CTA component `fdc5c6eb-5f7d-42a2-aaa4-7686e4755903` marked deleted. |
| Footer | `Footer` | reuse | `fd67c883-56ef-441e-b200-da77bb37eb92` | done | Existing native footer. |

## Page Composition
| Section order | Source section | YCode component/layers | Status | Notes |
|---|---|---|---|---|
| 1 | Navbar | `Navbar Light Native` | done | Keep. |
| 2 | Hero Systems | `Hero Systems` | done | Matches `section.banner-about` structure with responsive override for hero media. |
| 3 | Services overview | `Section System Overview` | done | Replaced `OverviewServicePrise2`. |
| 4 | About/video benefits | `Section System About Us` | done | Rejected inline section removed on 2026-05-25. |
| 5 | Case/testimonial slider | `Section System Testimonials` | done | Uses native YCode slider and Testimonials CMS data. |
| 6 | Meet the team | `SectionTeamGrid` | done | Existing Team component reused. |
| 7 | Brand promise | `Section System Brand Promise` | done | Replaced `SectionBrandPromise`. |
| 8 | Center CTA | `CTA Version 1` | done | Existing CTA reused. |
| 9 | Footer | `Footer` | done | Keep. |

## Interactions
| Source interaction | Native YCode approach | Status | Notes |
|---|---|---|---|
| Webflow scroll-in fade animations | YCode 1.13 interaction presets | pending | Use native reveal/stagger presets if motion fidelity is requested; no custom JS fallback unless presets are insufficient. |
| Hero/about/brand videos autoplay loop | Native `video` layer with asset `2704307f-4adc-4ed1-9e97-dfe0adfd1b8c` | done | Existing brand component and new about component use this asset. |
| Services card hover line/image | Existing YCode/Tailwind classes | done | Reused component. |
| Testimonial slider/tabs sync | Native YCode slider | done | `Section System Testimonials` initializes as Swiper in preview. |
| Brand promise marquee loop | Native YCode 1.13 raw component interaction | done | Marquee rebuilt to match Webflow structure: two `.loop-line` rows, each with four individual text layers. Interaction is stored on component root `apw-brand-root` and targets `apw-brand-marquee`; resolver remaps it per instance. Uses breakpoint-specific loop distances for French copy: desktop `-4080px`, tablet `-2730px`, mobile `-1930px`, 24s linear infinite. |

## Localization
| Locale | Status | Notes |
|---|---|---|
| FR primary defaults | in_progress | Component defaults should stay French. |
| EN draft translations | done | Draft component translations added for final component IDs. Missing final static keys (`sst-*`, Team label) added on 2026-05-25. Stale draft keys for deleted draft components are harmless and not used by the page. |

## QA
| Check | Status | Evidence | Notes |
|---|---|---|---|
| Desktop visual comparison | in_progress | Playwright 1440px preview check | No overflow; further pixel tuning may still be needed. |
| Tablet visual comparison | done | Playwright 834px preview check | No horizontal overflow. |
| Mobile visual comparison | done | Playwright 390px preview check | No horizontal overflow; hero order fixed. |
| No horizontal overflow | done | Desktop/tablet/mobile Playwright checks | `scrollWidth <= clientWidth`; wide marquee internals are clipped as intended. |
| No blocking console errors | done | Playwright console check | Source-code renderer changes were reverted per project rule; React `playsinline` warning can be addressed only with explicit source-code authorization. |
| Testimonials slider initializes | done | Playwright Swiper check | `.swiper` exists, has Swiper instance, and `slideNext()` changes active index. |
| Services overview grid | done | Playwright desktop/tablet/mobile check | Desktop renders 3 service cards per row; tablet/mobile collapse to 1 column; no overflow. |
| Brand promise marquee animates | done | Playwright desktop/mobile transform check | Native GSAP component interaction moves resolved `lyr-brand-apw-brand-marquee`; all eight text layers stay on one line, duplicate line gap is 30px, no horizontal overflow at desktop or 390px mobile. |
| CMS renders real data | done | Preview renders Services, Testimonials, Team Members | Bound through native collection layer variables. |
| Links resolve correctly | pending | | |
| Components editable in Builder | pending | | |
| Known differences documented | done | This ledger | Source Modix template copy translated to Bauhem FR defaults; existing native CTA/team/brand systems reused where they matched YCode direction. |
