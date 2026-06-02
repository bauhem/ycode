# Webflow to YCode Import Ledger

## Scope
| Field | Value |
|---|---|
| Source project | Bauhem Webflow export / DevLink |
| Target YCode project | Bauhem |
| Target pages | Services, Solutions, Realisations, About, dynamic Services, dynamic Solutions, dynamic Realisations |
| DevLink path | `webflow/` |
| Static export path | `bauhem-2026/` |
| Started by | OpenCode |
| Last updated | 2026-06-02 |

## Source Files
| Type | Path | Status | Notes |
|---|---|---|---|
| Variables CSS | `webflow/css/variables.css` | done | Tokens verified. |
| Classes CSS | `webflow/css/classes.css` | done | Animation target classes inspected. |
| Static HTML | `bauhem-2026/services.html` | done | Service hub/source interactions. |
| Static HTML | `bauhem-2026/solutions.html` | done | Solutions/source interactions. |
| Static HTML | `bauhem-2026/work.html` | done | Realisations/source interactions. |
| DevLink component | `webflow/hero/HeroServiceHub.tsx` | done | `a-3`, `a-21`. |
| DevLink component | `webflow/sections/SectionServiceIntro.tsx` | done | `a-3`, `a-32`, `slideInBottom`. |
| DevLink component | `webflow/listing/ListingServiceAll.tsx` | done | `a-3`; cards use same reveal pattern. |
| DevLink component | `webflow/hero/HeroCaseStudiesHub.tsx` | done | `a-3`. |
| DevLink component | `webflow/listing/ListingCaseStudiesAll.tsx` | done | pagination/card reveal source. |
| DevLink component | `webflow/cards/CardServiceItemMain.tsx` | done | Per-card `a-3` reveals. |
| DevLink component | `webflow/cards/CaseItemWrap.tsx` | done | Per-card `a-77` equivalent to `a-3`. |
| DevLink component | `webflow/cta/CtaVersion1.tsx` | done | `a-3`, `a-23`. |
| DevLink component | `webflow/cta/CtaVersion2.tsx` | done | `fadeIn`, `a-3`. |
| DevLink component | `webflow/sections/SectionBrandPromise.tsx` | done | Already reused from prior homepage work; source has `a-21`, `slideInRight`, `a-22`, `a-3`. |
| Static HTML | `bauhem-2026/detail_services.html` | done | Dynamic Service detail interaction source. |
| Static HTML | `bauhem-2026/detail_case-studies.html` | done | Dynamic Realisation detail interaction source. |
| Static HTML | `bauhem-2026/detail_industrial-ideas.html` | done | Dynamic Solution/idea detail source context. |
| Static HTML | `bauhem-2026/insights.html` | done | Insight animation reference for Solution-style sections. |
| DevLink component | `webflow/hero/HeroServicesDetail.tsx` | done | Dynamic Service hero uses `a-3` on label, media/content, sidebar. |
| DevLink component | `webflow/hero/HeroCaseStudiesDetail.tsx` | done | Dynamic Realisation hero uses `a-3` and `a-21`. |
| DevLink component | `webflow/sections/SectionProjectDetails.tsx` | done | Detail content uses `a-3` on sticky label and content column. |
| DevLink component | `webflow/hero/HeroBlogDetail.tsx` | done | Insight/blog detail reference uses `a-3` and `a-21`. |
| DevLink component | `webflow/sections/OverviewInsight.tsx` | done | Solution/insight section reference uses `a-21` media/card reveals. |
| Static HTML | `bauhem-2026/a-propos.html` | done | About page source interactions and section order. |
| DevLink component | `webflow/hero/HeroAPropos.tsx` | done | About hero uses `a-21`, hero scroll/load reveals, and page-start marquee loops. |
| DevLink component | `webflow/sections/SectionSystemOverview.tsx` | done | About service overview uses `a-3` on intro, title, button, and card targets. |
| DevLink component | `webflow/sections/SectionSystemAboutUs.tsx` | done | About systems block uses `a-3` and `a-21` on copy, benefits, video/stat. |
| DevLink component | `webflow/sections/SectionSystemTestimonials.tsx` | done | About testimonial section source for impact headline, slider, and logos. |
| DevLink component | `webflow/sections/SectionSystemBrandPromise.tsx` | done | About brand promise source with existing marquee loop and added content reveals. |
| DevLink component | `webflow/sections/SectionSystemCtaCenter.tsx` | done | About final centered CTA source (`a-3`, `a-35`); YCode page uses shared CTA Version 1 instead. |

## Interactions
| Source interaction | Native YCode approach | Status | Notes |
|---|---|---|---|
| `a-3` Basic Scroll Animation | `load` fade-up for above-fold hero content; `scroll-into-view` fade-up for below-fold sections/cards | done | Heroes use `load` so first viewport content is not hidden before scroll. Scroll reveals use `top 100%` so visible viewport content is not stuck hidden. |
| `a-21` Fade In | `load` fade-only for above-fold hero media/stats; `scroll-into-view` fade-only for below-fold media blocks | done | Applied to hero stat/media blocks and Solutions intro media blocks. |
| `fadeIn` | `scroll-into-view` fade-only: opacity 0 to 100, duration 1s | done | Applied to CTA Version 2 number items. |
| `a-32` Size Line | `scroll-into-view` height 0% to 100%, duration 0.6s | done | Applied to Service Intro vertical line layers. |
| `slideInBottom` | `scroll-into-view` y 100px to 0px with fade, duration 1s | done | Applied to Service Intro/List buttons and CTA Version 2 mobile link. |
| `a-23` Scale Image | Existing shared CTA Version 1 animation reused; CTA Version 2 has no image target | done | No extra image-scale target needed on static pages using CTA Version 2. |

## Dynamic Page Pass
| Page | ID | Draft interaction targets |
|---|---|---|
| Service detail | `1323de51-0da0-413a-b376-c4be33e0be5f` | hero label/title/image/summary/sidebar; details sticky label/content; review sticky label/card; page CTA section/image. |
| Solution detail | `375d916d-ee36-4ab9-b20b-4163457630e1` | hero label/title/advantages card; main content/approach/result blocks; related realisations header/intro/card. |
| Realisation detail | `4a8243f0-ede4-40ec-9435-3f67d3fda842` | hero title/description/meta/image; details sticky label/content; review sticky label/card. |

Dynamic pages use native YCode interaction data on explicit page-layer IDs only. Above-fold hero targets use `load`; below-fold detail, review, related, and CTA targets use `scroll-into-view` with `scrollStart: "top 100%"`. Draft `page_layers.content_hash` and `pages.content_hash` were updated to non-null values for all three dynamic pages.

## About Page Pass
| Component | ID | Draft interaction targets |
|---|---|---|
| Hero Systems | `914e14e7-5303-4987-b822-a268d8659a4b` | hero title, paragraph, buttons, subtitle, video wrapper, hero marquee fade + infinite loop. |
| Section System Overview | `6eff9962-6cac-4899-893a-ea4856ada873` | intro label, subtitle, desktop/mobile buttons, section title, service card template. |
| Section System About Us | `24cab0cd-1970-43e6-9f12-c73af9ef0ca5` | label, heading, paragraph, benefit blocks, video column, stat card. |
| Section System Testimonials | `7c7d2636-fdaa-4c3f-8279-f28a9197bc22` | impact headline, testimonial slider, logo slider. |
| Section System Brand Promise | `fce55ee3-5514-4564-98eb-042cac18cbb5` | title and button reveals; existing marquee loop preserved. |

About uses draft component interactions, not page-layer interactions. Edits were applied to both `components.layers` and `components.variants[0].layers`; all touched component hashes are non-null and variant sync was verified. Above-fold hero targets use `load`; below-fold sections use `scroll-into-view` with `scrollStart: "top 100%"`.

## YCode Targets
| Page | ID | Components |
|---|---|---|
| Services | `41e1f676-425f-43d8-b764-1b263cb27b67` | Navbar, Hero Service Hub, Section Service Intro, Listing Service All, CTA Version 2, Footer |
| Solutions | `1350c0c5-669c-4df4-9d5c-62fa7ab51d1a` | Navbar, Hero Solutions Hub, Section Solutions Intro, Listing Solutions All, SectionBrandPromise, CTA Version 1, Footer |
| Realisations | `9d005266-d461-4729-8962-24302b18a71e` | Navbar, Hero Case Studies Hub, Listing Case Studies All, CTA Version 2, Footer |
| About | `63c9b84b-fe8b-4f0a-a2e4-de3d3126efdf` | Navbar, Hero Systems, Section System Overview, Section System About Us, Section System Testimonials, SectionTeamGrid, Section System Brand Promise, CTA Version 1, Footer |
| Dynamic Service | `1323de51-0da0-413a-b376-c4be33e0be5f` | Navbar, Service detail hero, Section Details, Section Review, related services, page CTA, Footer |
| Dynamic Solution | `375d916d-ee36-4ab9-b20b-4163457630e1` | Navbar, Solution hero, description grids, related realisations, CTA Version 2, Footer |
| Dynamic Realisation | `4a8243f0-ede4-40ec-9435-3f67d3fda842` | Navbar, Case Study Hero, Section Details, Section Review, CTA Version 1, Footer |

## QA
| Check | Status | Evidence | Notes |
|---|---|---|---|
| Draft-only write | done | `ycode_get_unpublished_changes` lists the 9 target static components plus existing Navbar draft changes. | No publish run. |
| Component sync/hash | done | SQL verification: all target components have `content_hash IS NOT NULL` and `layers = variants #> '{0,layers}'`. | Default variant edits were synchronized. |
| Desktop preview | done | Playwright: `/ycode/preview/services`, `/ycode/preview/solutions`, `/ycode/preview/realisations` at `1440x1000`. | 0 hidden animated text nodes in viewport after load/scroll. |
| Mobile preview | done | Playwright: same routes at `390x844`. | 0 hidden animated text nodes in viewport after load/scroll. |
| No console errors | done | Playwright console capture returned `errors: []` on all 6 route/viewport checks. | |
| No horizontal overflow | done | Playwright final QA returned `initialOverflow: 0`, `finalOverflow: 0`, `scrollXAfterAttempt: 0` on all 6 route/viewport checks. | CTA Version 2 mobile accent text reduced from `46px` to `40px` and given `break-words max-w-full` to remove a 7px overflow. |
| Dynamic desktop preview | done | Playwright: `/ycode/preview/services/optimisation-processus`, `/ycode/preview/solutions/migration-ycode-systemes-composables`, `/ycode/preview/realisations/ose-media` at `1440x900`. | 0 console errors, 0 horizontal overflow, 0 stuck animated content. Transparent locale select is an expected desktop overlay. |
| Dynamic mobile preview | done | Playwright: same routes at `390x844`. | 0 console errors, 0 horizontal overflow, 0 stuck animated content. |
| About desktop preview | done | Playwright: `/ycode/preview/a-propos` at `1440x900`. | 0 console errors, 0 horizontal overflow, 0 stuck animated content. |
| About mobile preview | done | Playwright: `/ycode/preview/a-propos` at `390x844`. | 0 console errors, 0 horizontal overflow, 0 stuck animated content. |

## Applied Draft Changes
| Component | ID | Interaction targets |
|---|---|---|
| Hero Service Hub | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f0001` | title wrapper, stat card, hero image wrapper. |
| Section Service Intro | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f0002` | label wrapper, heading wrapper, button wrapper, center/left/right lines. |
| Listing Service All | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f0003` | title wrapper, button wrapper, service card item. |
| CTA Version 2 | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f0004` | label wrapper, accent text, stat items, description wrapper, mobile link wrapper. |
| Hero Solutions Hub | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f1001` | title wrapper, links wrapper. |
| Section Solutions Intro | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f1002` | label wrapper, copy block, loop block, video/stat block, stat card. |
| Listing Solutions All | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f1003` | accent wrapper, solution card item. |
| Hero Case Studies Hub | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f0010` | label wrapper, title wrapper, paragraph wrapper. |
| Listing Case Studies All | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f0011` | case item. |
| Footer | `fd67c883-56ef-441e-b200-da77bb37eb92` | footer bottom reveal `scrollStart` adjusted to `top 100%` so it triggers at mobile page bottom. |
| Dynamic Service page | `1323de51-0da0-413a-b376-c4be33e0be5f` | 11 draft page-layer interactions applied. |
| Dynamic Solution page | `375d916d-ee36-4ab9-b20b-4163457630e1` | 9 draft page-layer interactions applied. |
| Dynamic Realisation page | `4a8243f0-ede4-40ec-9435-3f67d3fda842` | 8 draft page-layer interactions applied. |
| Hero Systems | `914e14e7-5303-4987-b822-a268d8659a4b` | 6 draft target layers updated; hero marquee includes fade plus loop interactions. |
| Section System Overview | `6eff9962-6cac-4899-893a-ea4856ada873` | 6 draft target layers updated. |
| Section System About Us | `24cab0cd-1970-43e6-9f12-c73af9ef0ca5` | 7 draft target layers updated. |
| Section System Testimonials | `7c7d2636-fdaa-4c3f-8279-f28a9197bc22` | 3 draft target layers updated. |
| Section System Brand Promise | `fce55ee3-5514-4564-98eb-042cac18cbb5` | 2 draft target layers updated; existing marquee loop preserved. |
