# JollyWorld

A physics-based multiplayer game featuring ragdoll characters, destructible environments, and a powerful level editor. Built with web technologies for browser-based gameplay.

## Overview

JollyWorld is a browser-based physics sandbox game where players navigate through user-created levels filled with obstacles, hazards, and challenges. The game features realistic physics simulation, multiplayer support for up to 8 players, gore effects, and an extensive level editor for creating custom content.

**Live Game:** [jollyworld.app](https://jollyworld.app)

## Features

### Gameplay
- **Realistic Physics** - Powered by Box2D WASM for accurate 2D rigid body simulation
- **Multiplayer** - Real-time multiplayer for up to 8 concurrent players with synchronized physics
- **Multiple Vehicles** - Bikes, dirt bikes, skateboards, skippyballs, and more
- **Character Customization** - 16 character skins with customizable hats and accessories
- **Gore System** - Dynamic blood particles and mesh breakage on impact
- **User-Generated Content** - Play thousands of community-created levels

### Level Editor
- **Visual Physics Editor** - Built-in editor for creating custom levels with full physics control
- **77+ Prefabs** - Pre-built game objects including weapons, vehicles, NPCs, and environmental objects
- **Drawing Tools** - Create custom shapes and terrain with polygon drawing
- **Joint System** - Connect objects with motors, springs, and hinges
- **Blueprint System** - Save and share level designs as reusable blueprints
- **Theme Support** - Multiple visual themes (Egypt, Warehouse, Lost World, Candy Land, Hell, Heaven, Space, Japan, Africa)

### Technical Features
- **WebGL Rendering** - Hardware-accelerated graphics using PIXI.js
- **Audio System** - Dynamic sound effects with MIDI music support
- **Local Storage** - Auto-save levels with compression using IndexedDB
- **Social Integration** - Share levels and scores across platforms
- **Cross-Platform** - Runs on desktop and mobile browsers

## Tech Stack

### Core Technologies
- **PIXI.js 6.0.2** - WebGL rendering engine
- **Box2D WASM** - High-performance physics simulation
- **Webpack 4** - Module bundling and build system
- **Babel 7** - ES6+ transpilation
- **SASS** - CSS preprocessing

### Key Libraries
- **Networking:** Geckos.io typed-array-buffer-schema, @poki/netlib
- **Audio:** Howler.js, WebAudioFontPlayer (MIDI)
- **Graphics:** pixi-filters, pixi-particles, pixi-heaven
- **Storage:** idb-keyval (IndexedDB), lz-string (compression)
- **UI:** dat.gui (editor interface), simplebar, fontfaceobserver
- **Utilities:** anime.js (animations), canvas-confetti, simplify-js

## Project Structure

```
jollyworld/
├── src/                      # Source code
│   ├── Game.js              # Core game engine and loop
│   ├── Settings.js          # Global configuration
│   ├── b2Editor/            # Level editor system
│   ├── prefabs/             # 77+ reusable game objects
│   │   ├── humanoids/       # Characters and NPCs
│   │   ├── vehicles/        # Bikes, skateboards, etc.
│   │   ├── weapons/         # Swords, guns, explosives
│   │   ├── movement/        # Trampolines, jets, boosters
│   │   └── decoration/      # Visual elements
│   ├── multiplayer/         # Networking and sync
│   ├── ui/                  # User interface
│   ├── utils/               # 32+ utility modules
│   ├── data/                # Level data and emitters
│   └── css/                 # Styles
├── static/                  # Static assets
│   ├── assets/
│   │   ├── images/          # Sprites and UI graphics
│   │   ├── audio/           # Audio sprites (HQ/LQ)
│   │   └── blueprints/      # Level blueprints
│   ├── privacy-policy/      # Legal documents
│   └── terms/
├── tasks/                   # Build automation
└── build/                   # Production output
```

## Getting Started

### Prerequisites
- Node.js (v12+)
- Yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/ErikSom/JollyWorld.git
cd JollyWorld

# Install dependencies
yarn install
```

### Development

```bash
# Start development server with hot reload
yarn watch

# Build for production
yarn build

# Generate audio sprites
yarn audiosprites-core
yarn audiosprites-pack1
yarn audiosprites-pack2

# Generate level blueprints
yarn blueprints

# Start local server
yarn server
```

The game will be available at `http://localhost:8080` (or the port shown in terminal).

### Building

The build process involves:
1. Webpack bundling (JS/CSS)
2. Code obfuscation
3. File hashing for cache busting

```bash
yarn build
```

Output is generated in the `build/` directory.

## Game Architecture

### Physics Engine
- **PTM (Pixels To Meters):** 30
- **Time Step:** 1/30 seconds (30 FPS physics)
- **Collision Layers:** 9 types including character-only, trigger-only, and custom filters
- **Gore System:** Dynamic particle emitters with mesh breakage

### Multiplayer
- **Protocol:** Binary message packing for bandwidth optimization
- **Max Players:** 8 concurrent players per room
- **Synchronization:** Server-authoritative with client-side prediction
- **Features:** Lobby system, voting, chat with emojis, leaderboards

### Rendering Pipeline
- **Resolution:** Target 1920x1080 with dynamic aspect ratio support (1.20 - 2.60)
- **HDR Support:** Post-processing effects composer
- **Particle Systems:** Custom emitters for blood, explosions, and effects
- **Camera:** Physics-based camera with smooth following and zoom

## Configuration

Key settings can be modified in [src/Settings.js](src/Settings.js):

- `targetFPS`: Frame rate limit (default: 60)
- `maxMultiplayerPlayers`: Maximum players (default: 8)
- `goreEnabled`: Toggle gore effects
- `physicsTimeStep`: Physics simulation rate
- And many more...

## API Endpoints

The game connects to backend services:
- **API:** `https://api.jollyworld.app`
- **Static Assets:** `https://static.jollyworld.app`
- **OAuth Redirect:** `https://jollyworld.app/login.html`

For local development, these can be modified in Settings.js.

## Assets

### Audio
Audio sprites are generated from source files using audiosprite:
- **Core SFX:** Essential game sounds
- **Pack 1 & 2:** Extended sound libraries
- **Formats:** OGG and MP3 with HQ/LQ variants

### Images
- Sprite atlases for prefabs organized by category
- Texture library with 160+ tile textures
- Background themes and environmental art

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

**What this means:**
- ✅ You can view, study, and learn from the code
- ✅ You can modify and adapt it for personal/educational use
- ✅ You can share your modifications (under the same license)
- ❌ You **cannot** use this commercially
- ❌ You **cannot** sell this game or use it in commercial products
- ⚠️ You must give appropriate credit and indicate changes made

See the [LICENSE](LICENSE) file for the complete legal text.

## Credits

**Author:** Erik Sombroek

**Powered By:**
- PIXI.js - WebGL Rendering
- Box2D - Physics Engine
- Poki - Game Platform Integration

## Links

- **Play Online:** [jollyworld.app](https://jollyworld.app)
- **Discord Community:** [Join our Discord](https://discord.gg/7ZWxBam9Hx) for support and level sharing
- **Report Bugs:** Use GitHub Issues

---

**Note:** This game is not for kids - it features physics-based violence and gore effects.