# Kunjal — A Little World of Curiosity

An interactive portfolio using the original sunset floating-island illustration, restored at **5460 × 3072** for sharper close-ups.

Fork: https://github.com/Tanmay-Ts/Kunjalmahajan02.github.io

Development copy: https://github.com/Tanmay-Ts/kunjal-floating-world

This version is kept in Tanmay-Ts's repositories. The fork retains its relationship to [the original portfolio repository](https://github.com/Kunjalmahajan02/Kunjalmahajan02.github.io); the original website and repository are not changed.

## Explore the world

- Select **Research**, **Projects**, or **Creative** to zoom toward the corresponding island. Content appears after the camera finishes moving.
- The same image remains in view throughout the transition. Research does not switch to a different interior illustration.
- The cream header, serif typography, sunset colors, glass buildings, waterfalls, pink trees, and original island arrangement are preserved.
- Waterfall highlights, drifting mist, and warm motes animate gently. Motion off and the system reduced-motion preference stop ambient movement and make navigation immediate.
- Contact and résumé remain available from the header. Back to world, the close control, Escape, and browser Back return to the overview.
- Research includes AI & engineering and Space & physics filters, full topic notes, connected topics, and related projects. These are interests and working notes; no publications or credentials are invented.

## Image quality

The supplied 1365 × 768 PNG was upscaled four times on each axis using the general **Real-ESRGAN x4plus** model. Its composition was preserved rather than regenerated. The native output was inspected for alignment and tile seams.

- [Full-resolution PNG](./public/world/sunset-world-hd.png): 5460 × 3072 master.
- [Lossless WebP](./public/world/sunset-world-hd.webp): identical decoded pixels, used by the website.

The image stays as one persistent DOM node. Its actual layout dimensions change during zoom, avoiding enlargement of an already-rasterized CSS layer. The maximum zoom is bounded by native image width divided by displayed base width and the actual device pixel ratio. Desktop zoom is additionally capped at 2.2×, portrait zoom at 3×. High-DPI screens automatically receive a lower maximum when necessary. AI upscaling improves inferred detail; it cannot recover information that was never present in the source.

Tool: [Real-ESRGAN portable NCNN/Vulkan Windows release](https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0), package dated 20220424. Processing used `realesrgan-x4plus`, scale 4, tile 256, NVIDIA GPU 1, and threads `1:1:1`. The portable executable and temporary files are kept outside the tracked website in the ignored QA directory. Licenses: [NCNN implementation, MIT](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/blob/master/LICENSE); [Real-ESRGAN, BSD-3-Clause](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE).

## Run locally

Requires Node.js 20+ and npm.

```sh
npm ci
npm run dev
```

## Validate a production build

```sh
npm run build
npm run check
npm run preview
```

The build check validates relative paths, required portfolio artwork and résumé files, and accidental secret patterns. Direct hash routes work on static hosting without rewrites.

## Edit content and appearance

- [src/data/](./src/data/): profile, projects, research topics, and creative credits.
- [IllustratedWorld.jsx](./src/world/IllustratedWorld.jsx): image loading, continuous zoom, pixel-budget limits, and landmark projection.
- [WorldAtmosphere.jsx](./src/components/WorldAtmosphere.jsx): aligned waterfall highlights, cloud mist, and light effects.
- [IslandWorld.jsx](./src/components/IslandWorld.jsx): landmark links, travel status, and fallback navigation.
- [App.jsx](./src/App.jsx): routing and camera-arrival gating.
- [AppWindow.jsx](./src/components/AppWindow.jsx): accessible reading drawer.
- [ResearchApp.jsx](./src/windows/ResearchApp.jsx): research categories, topic cards, and full notes.
- [world.css](./src/styles/world.css) and [research.css](./src/styles/research.css): interface and drawer appearance.

Portfolio content is retained from [Kunjalmahajan02.github.io](https://github.com/Kunjalmahajan02/Kunjalmahajan02.github.io). The earlier procedural 3D experiment is preserved on the `prototype/continuous-world` branch. Its source is not imported into the current entry point or bundled into this illustrated experience.

## Hosting

A temporary preview serves only the production build through a [Cloudflare Quick Tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/). Its random public URL remains available only while the local static server and tunnel processes run and the computer stays online. Stopping the tunnel ends access; closing a browser tab alone does not. The tunnel is not installed as a service and does not start automatically.

Permanent hosting is not enabled for this preview. GitHub Pages deployment remains **manual only** in [deploy.yml](./.github/workflows/deploy.yml); pushing this repository does not deploy the original site or trigger a Pages deployment.

To publish later, configure hosting for this new repository, set canonical/OG URLs in [index.html](./index.html) to the new deployment address, and run the deployment workflow. `base: './'` preserves compatibility with repository subpaths.
