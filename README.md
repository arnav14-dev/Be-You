# BE YOU — website preview

A static preview of the proposed website for **BE YOU**, a premium bag manufacturer in Bhiwandi, Thane. It covers corporate gifting, private label and custom manufacturing.

**Live preview:** https://arnav14-dev.github.io/Be-You/

## Run locally

There's no build step. Open `index.html` in a browser, or serve the folder with any static server, such as VS Code Live Server.

## Structure

| Path | What it holds |
| --- | --- |
| `index.html` | The page and all section markup |
| `assets/css/site.css` | Design tokens, layout, components, responsive rules |
| `assets/js/catalogue.js` | Categories, products (SKU, copy, photo) and client logos |
| `assets/js/site.js` | Rendering, navigation, collection panel, product view, quote form, motion |
| `assets/js/studio.js` | WebGL personalisation preview (foil / deboss on leather) |
| `assets/img/products/` | Product cut-outs, transparent WebP, 1080×1350 |
| `assets/img/stock/`, `assets/img/*.jpg` | Editorial and factory photography |
| `assets/img/logos/` | Client logos |

`atelier-bags-premium.html` only redirects to `index.html` so that older links keep working.

## Stack

- Plain HTML, CSS and JavaScript, with no framework.
- [GSAP 3.12](https://gsap.com/) with ScrollTrigger, and [Lenis](https://lenis.darkroom.engineering/) smooth scroll, loaded from CDNs.
- Fonts: Bodoni Moda (display), Jost (labels), Inter (body), from Google Fonts.
- Main colours:

  | Token | Hex |
  | --- | --- |
  | `--ink` | `#100D0A` |
  | `--bone` | `#F1EADA` |
  | `--bone-2` | `#E7DEC9` |
  | `--brass` | `#B08A52` |
  | `--brass-soft` | `#C9A876` |

## Personalised links

Add `?brand=` to tailor the preview for a prospect. The preloader then says "Prepared for …" and the personalisation studio starts with that name:

```
https://arnav14-dev.github.io/Be-You/?brand=Tata%20Motors
https://arnav14-dev.github.io/Be-You/?brand=Tata%20Motors&finish=silver&leather=navy
```

| Parameter | Values |
| --- | --- |
| `finish` | `gold`, `silver`, `blind`, `emboss` |
| `leather` | `espresso`, `noir`, `cognac`, `tan`, `oxblood`, `navy`, `olive` |

## Before launch

- **Quote form:** it currently sends the enquiry to WhatsApp. Email delivery still needs a backend or form service.
- **Photography:** the stock and factory photos are placeholders until BE YOU supplies its own.
- **Search indexing:** remove the `noindex` robots tag in `index.html` so search engines can index the site.

Client logos are trademarks of their respective owners. They're shown as companies BE YOU has worked with.
