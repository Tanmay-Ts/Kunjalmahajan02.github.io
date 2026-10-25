# Kunjal — A Little World of Curiosity

A separate interactive portfolio in a living, three-dimensional floating world.

Visual status: the interface and sunset palette follow the approved reference. The world is a real-time 3D reconstruction; matching the original illustration's exact painterly detail remains unfinished.

Repository: https://github.com/Tanmay-Ts/kunjal-floating-world

This repository is independent of [the original portfolio](https://kunjalmahajan02.github.io/). Its remote points only to the new repository. The original website and repository are not changed.

## Explore the world

- **Research:** enter the glass library. The camera travels through the same three-dimensional scene toward its bookshelves and reading table, then reveals research topics.
- **Projects:** fly to the observatory to browse projects and their case studies, including interactive demos.
- **Creative:** visit the garden pavilion for dance, art, fashion, and modelling.
- **Look around:** drag the scene to rotate the view; scroll or pinch to move closer. Select a building or its label to enter.
- **Contact and résumé:** accessible from the persistent navigation.
- **Return:** use Back to world, the drawer's close control, Escape, or browser Back. Escape also cancels an ongoing camera journey.
- Research includes AI & engineering and Space & physics filters, full topic notes, connected topics, and related projects. These are interests and working notes; no publications or credentials are invented.

The environment is built from Three.js geometry, materials, lighting, and procedural water effects. It uses no landscape photograph, background illustration, or replacement interior image. A single WebGL renderer and world remain mounted through navigation. Buildings, plants, bridges, clouds, water, and library furnishings occupy the same space. Camera movement completes before content is mounted.

The renderer uses antialiasing and a device pixel ratio up to 2, so approaching a building draws its geometry at the current viewport resolution instead of enlarging bitmap pixels. Motion off and the system reduced-motion preference stop ambient movement and make travel immediate. Rendering pauses in hidden tabs. If WebGL is unavailable, the same portfolio content stays accessible through HTML navigation. Content and navigation support keyboard focus, direct hash links, and independent drawer scrolling.

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

The build check validates relative asset paths, required portfolio assets and résumé files, and accidental secret patterns. Routes such as `#/research/vision` work on static hosting without rewrites.

## Edit content and appearance

- [src/data/](./src/data/): profile, projects, research topics, and creative credits.
- [buildWorld.js](./src/world/buildWorld.js): procedural islands, architecture, furnishings, plants, clouds, and flowing water.
- [WorldScene.jsx](./src/world/WorldScene.jsx): renderer, lights, perspective camera travel, world picking, and orbit controls.
- [createAtmosphere.js](./src/world/createAtmosphere.js): procedural sunset and animated volumetric clouds.
- [createVegetation.js](./src/world/createVegetation.js): individually modeled foliage, blossoms, grass, and hanging vines.
- [IslandWorld.jsx](./src/components/IslandWorld.jsx): projected landmark links, travel status, and fallback navigation.
- [App.jsx](./src/App.jsx): routing and camera-arrival gating for content.
- [AppWindow.jsx](./src/components/AppWindow.jsx): accessible reading drawer.
- [ResearchApp.jsx](./src/windows/ResearchApp.jsx): research categories, topic cards, and full notes.
- [world.css](./src/styles/world.css) and [research.css](./src/styles/research.css): interface and drawer appearance.

Portfolio content and original project components are retained from [Kunjalmahajan02.github.io](https://github.com/Kunjalmahajan02/Kunjalmahajan02.github.io). The supplied fantasy landscape informed the palette and architectural direction only. The environment itself is implemented in code.

## Hosting

No production site has been deployed for this experiment. GitHub Pages deployment is **manual only** in [deploy.yml](./.github/workflows/deploy.yml); pushing this repository does not deploy the original site or trigger a Pages deployment.

To publish later, configure hosting for this new repository, set canonical/OG URLs in [index.html](./index.html) to the new deployment address, and run the deployment workflow. `base: './'` preserves compatibility with repository subpaths.
