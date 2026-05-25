# Webflow to YCode Import Ledger — Contact

## Scope
| Field | Value |
|---|---|
| Source project | Bauhem Webflow export |
| Target YCode project | Current YCode site |
| Target page(s) | Contact |
| DevLink path | `/Users/bauhem/Documents/Github/ycode/webflow` |
| Static export path | `/Users/bauhem/Documents/Github/ycode/bauhem-2026` |
| Started by | OpenCode agent |
| Last updated | 2026-05-25 |

## Source Files
| Type | Path | Status | Notes |
|---|---|---|---|
| Static HTML | `bauhem-2026/contact.html` | done | Visual/browser source for Contact page |
| Static CSS | `bauhem-2026/css/bauhem-2026-54564a.webflow.css` | done | Visual styles and media queries |
| Static CSS | `bauhem-2026/css/webflow.css` | reviewed | Webflow runtime defaults |
| Static CSS | `bauhem-2026/css/normalize.css` | reviewed | Browser reset |
| DevLink variables | `webflow/css/variables.css` | done | Token source |
| DevLink classes | `webflow/css/classes.css` | done | Class source |
| DevLink tags/defaults/global | `webflow/css/*.css` | reviewed | Shared defaults |
| DevLink contact section | `webflow/sections/SectionContactHero.tsx` | done | Contact-specific structure |
| DevLink CTA | `webflow/cta/CtaVersion1.tsx` | pending | Reusable CTA pattern if used |
| DevLink navigation/footer | `webflow/navigation`, `webflow/NavbarCta.tsx` | pending | Reuse/reference only if needed |
| Static assets | `bauhem-2026/images`, `bauhem-2026/videos` | pending | Image/video references |

## Inferred Design System
| Type | Source token/class | Source value | YCode target | Status | Notes |
|---|---|---|---|---|---|
| Color | Primary / Black / Creamy White / Paragraph / Stroke / White | Webflow tokens | Existing YCode color variables | done | Reused existing YCode variables |
| Typography | Contact H1 | Webflow `5rem` | YCode-approved 64px desktop scale | done | YCode hero scale prevails over Webflow |
| Spacing | `.section.contacts-banner` | `padding-top: 140px`; base section bottom rhythm | Native contact section | done | 140px top, 80px bottom, responsive overrides |
| Radius | `--radius-small` | `10px` | Native form card and fields | done | Matches Webflow small radius |
| Grid | Contact columns | 50% / 50%, stack on tablet | Native flex columns | done | Verified generated classes and responsive stack |

## CMS Mapping
| Source list/model | YCode collection | Fields | Status | Notes |
|---|---|---|---|---|
| Contact page content | Static YCode page content | Native page layers | done | No CMS-backed content required |

## Assets
| Source asset | YCode asset ID | Usage | Status | Notes |
|---|---|---|---|---|
| `bauhem-reel` video | `2704307f-4adc-4ed1-9e97-dfe0adfd1b8c` | SectionBrandPromise | reused | Existing native component handles video |

## Components
| Source component/section | Native YCode target | Reuse/Create | YCode ID | Status | Notes |
|---|---|---|---|---|---|
| Navbar | Native navbar | reuse | `941add24-ad6c-4dac-b713-957884d7acc0` | done | Reused `Navbar Light Native` |
| Contact hero/form section | Native component | create/update | `0a12f9b3-9f50-4c07-8c4b-1f74ad6f1004` | done | Extracted into `Contact Hero Form`; built with native YCode layers and proper form controls |
| Brand promise / video CTA | Native component | reuse | `adea954f-7cb9-48b2-bc3e-0271608d5ab5` | done | Matches source Contact page section type better than CTA Version 1 |
| Footer | Native footer | reuse | `fd67c883-56ef-441e-b200-da77bb37eb92` | done | Reused existing native footer |

## Page Composition
| Section order | Source section | YCode component/layers | Status | Notes |
|---|---|---|---|---|
| 1 | Navbar | `Navbar Light Native` | done | |
| 2 | Contact hero/form | `Contact Hero Form` | done | Native component instance |
| 3 | Brand promise/video | `SectionBrandPromise` | done | Source Contact uses this family of section |
| 4 | Footer | `Footer` | done | |

## Interactions
| Source interaction | Native YCode approach | Status | Notes |
|---|---|---|---|
| Contact form submit | Native YCode form | done | `settings.id` and `attributes.id` set to `contact-form`; inputs: name, phone, email, service, message |
| Link hover states | Native Tailwind classes | done | Contact links and button hover styles applied |
| Navigation dropdown | Existing native navbar behavior | reused | Handled by `Navbar Light Native` |

## QA
| Check | Status | Evidence | Notes |
|---|---|---|---|
| Desktop visual comparison | done | `contact-preview-desktop-final.png` | Preview verified at `http://localhost:3002/ycode/preview/contact` |
| Tablet visual comparison | pending | | Not separately captured |
| Mobile visual comparison | done | `contact-preview-mobile-final.png` | 390px viewport |
| No horizontal overflow | done | `scrollWidth <= innerWidth` | Verified desktop and mobile |
| Form fields render and are editable | done | 5 controls found | `input`, `select`, `textarea` are native controls |
| Form ID detection | done | `Contact Hero Form` component | Form layer has `settings.id = contact-form` for YCode submissions |
| Links resolve correctly | done | Snapshot | Phone/email links present |
| Components editable in Builder | done | Existing/native components reused | Contact section is now `Contact Hero Form` component |
| Known YCode design-system divergences documented | done | Ledger | YCode hero text scale prevails over Webflow `5rem` |
