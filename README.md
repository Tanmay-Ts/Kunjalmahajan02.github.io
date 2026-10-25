# Kunjal Mahajan — A Botanical Sanctuary

The [live Sanctuary design](https://kunjalmahajan02.github.io/sanctuary/) adapted into the fork's smooth, accessible portfolio experience.

Fork: https://github.com/Tanmay-Ts/Kunjalmahajan02.github.io

Development copy: https://github.com/Tanmay-Ts/kunjal-floating-world

The original website and repository remain unchanged.

## Design and navigation

- The full-screen four-island landscape, Cormorant Garamond and Jost typography, floating white labels, warm ivory paper, and brass accents follow the live Sanctuary.
- **Projects / The Glasshouse:** six arched glass plaques open the existing project case studies and interactive demos.
- **Research / The Observatory:** a parchment reading folio preserves both research filters, all topic notes, and related project links.
- **Creative / The Pavilion:** arched frames present the existing dance, art, fashion, and modelling content.
- **Contact / The Post Garden:** contact links, résumé, biography, education and skills remain available.
- Mini Kunjal is an optional guide. Her message opens only when selected. The guide starts collapsed on compact screens and remembers dismissal.
- Phones and portrait tablets use an ivory page with a framed landscape and a 2×2 island menu. Inside a destination, readable panels scroll over the landscape.

Camera movement and content arrival use the existing interaction engine. One image remains mounted throughout zooming; there is no switch to an unrelated interior image. Rapid route changes, Escape, browser Back, direct links, keyboard focus, and reduced-motion settings are preserved. Motion controls are labelled accurately; there is no autoplay sound.

## Artwork and image quality

The Sanctuary's original 1672×941 artwork is upscaled to **6688×3764** using the approved local Real-ESRGAN x4plus workflow. Its composition is preserved. The native output was inspected for sharpness and tile seams.

- [PNG master](./public/world/sanctuary-hd.png): 6688×3764, full-resolution output.
- [WebP image](./public/world/sanctuary-hd.webp): same native dimensions, quality94/method6, approximately 5.08 MB.
- [Mini Kunjal](./public/world/mini-kunjal.webp): original guide artwork from the live Sanctuary.

The browser resizes the image's actual layout box during zoom rather than scaling a cached low-resolution layer. Zoom is limited by the source pixels, viewport and actual device pixel ratio. Each island has its own framing target. The earlier sunset upscales remain available in [public/world/](./public/world/) as prior design assets.

Artwork and visual direction are sourced from [Kunjal's Sanctuary](https://kunjalmahajan02.github.io/sanctuary/). Fonts are bundled locally. Upscaler: [Real-ESRGAN portable NCNN/Vulkan](https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0), general x4plus model, 4× scale, NVIDIA GPU 1, tile 256, threads 1:1:1. Tool licenses: [MIT implementation](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/blob/master/LICENSE) and [BSD-3-Clause model project](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE). Tools and temporary files stay in the ignored QA directory.

## Run and validate

Requires Node.js 20+ and npm.

```sh
npm ci
npm run dev
npm run build
npm run check
```

The production check validates relative asset paths, required artwork, native master dimensions, résumé files, and accidental secret patterns. Hash routes work on static hosting without rewrites.

## Project structure

- [src/data/](./src/data/): profile, projects, research and creative content.
- [sanctuaryDestinations.js](./src/world/sanctuaryDestinations.js): names, focus points and label placement for all four islands.
- [IllustratedWorld.jsx](./src/world/IllustratedWorld.jsx): continuous camera movement, image loading and native-pixel zoom limits.
- [SanctuaryAtmosphere.jsx](./src/components/SanctuaryAtmosphere.jsx): aligned waterfall effects and valley mist.
- [IslandWorld.jsx](./src/components/IslandWorld.jsx): home composition, projected labels and island navigation.
- [App.jsx](./src/App.jsx): routing and camera-arrival gating.
- [AppWindow.jsx](./src/components/AppWindow.jsx): room navigation and accessible content folios.
- [SanctuaryGuide.jsx](./src/components/SanctuaryGuide.jsx): optional Mini Kunjal guide.
- [sanctuary.css](./src/styles/sanctuary.css), [sanctuary-panels.css](./src/styles/sanctuary-panels.css), and [sanctuary-guide.css](./src/styles/sanctuary-guide.css): responsive design.

Portfolio content and project components are retained from [the original repository](https://github.com/Kunjalmahajan02/Kunjalmahajan02.github.io). Previous rendering experiments are not imported by the active entry point.

## Temporary hosting

The temporary preview serves only the production build through a [Cloudflare Quick Tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/). Its random URL is available while the local server and tunnel run and this computer stays online. Stopping the tunnel ends access; closing a browser tab alone does not. No service or autostart is installed.

Permanent hosting is not enabled. GitHub Pages remains manual-only through [deploy.yml](./.github/workflows/deploy.yml). Pushing does not deploy the original site or automatically publish this fork to Pages.
