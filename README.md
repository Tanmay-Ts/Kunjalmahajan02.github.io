# Kunjal — A Little World of Curiosity

A separate, interactive portfolio experiment based on the **Enter the Library** design.

Repository: https://github.com/Tanmay-Ts/kunjal-floating-world

This repository is independent of [the original portfolio](https://kunjalmahajan02.github.io/). Its remote points only to the new repository. The original website and repository are not changed.

## Explore the world

- **Research:** select the glass library. The camera moves toward the island, blends into its interior, and reveals a reading drawer.
- **Projects:** enter the observatory to browse the existing projects and their case studies, including interactive demos.
- **Creative:** visit the garden pavilion for dance, art, fashion, and modelling.
- **Contact and résumé:** accessible from the persistent navigation.
- **Return:** use Back to world, the drawer’s close control, Escape, or browser Back.
- Research contains filters for AI & engineering and Space & physics. Each topic opens its full notes, connected topics, and related projects. These are interests and working notes; no publications or credentials are invented.

The environment uses illustrated backgrounds with CSS camera transforms and transitions. Animated waterfall highlights, drifting cloud banks, rising mist, and warm library motes give the scene movement. Canvas effects pause in hidden tabs and stop when Motion off or the system reduced-motion preference is enabled. Content and navigation are real HTML controls, with keyboard focus, direct hash links, and independent drawer scrolling.

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

The build check validates relative asset paths, required artwork and résumé files, and accidental secret patterns. Routes such as `#/research/vision` work on static hosting without rewrites.

## Edit content and appearance

- [src/data/](./src/data/): existing profile, projects, research topics, and creative credits.
- [IslandWorld.jsx](./src/components/IslandWorld.jsx): environment imagery and landmark links.
- [WorldAtmosphere.jsx](./src/components/WorldAtmosphere.jsx): animated water, cloud, mist, and library light layers.
- [AppWindow.jsx](./src/components/AppWindow.jsx): accessible reading drawer.
- [ResearchApp.jsx](./src/windows/ResearchApp.jsx): research categories, topic cards, and full notes.
- [world.css](./src/styles/world.css) and [research.css](./src/styles/research.css): world and drawer appearance.
- [public/world/](./public/world/): optimized island and library backgrounds.

Portfolio content and original project components are retained from [Kunjalmahajan02.github.io](https://github.com/Kunjalmahajan02/Kunjalmahajan02.github.io). The island landscape was supplied as the design reference; the matching library interior was generated for this redesign and saved with the project. Earlier canvas-room source remains available, but is not used by the new entry point.

## Hosting

No production site has been deployed for this experiment. GitHub Pages deployment is **manual only** in [deploy.yml](./.github/workflows/deploy.yml); pushing this repository does not deploy the original site or trigger a Pages deployment.

To publish later, configure hosting for this new repository, set canonical/OG URLs in [index.html](./index.html) to the new deployment address, and run the deployment workflow. `base: './'` preserves compatibility with repository subpaths.
