# Dual 2D / 3D Experience: Classic Blueprint Marketplace & 3D Toronto Automotive World

## Executive Summary
This update introduces a seamless toggle between two distinct visual experiences in Lot & Ledger:
1. **Classic 2D Mode**: Faithfully restores the original v1.5 minimalist blueprint silhouette marketplace with vector technical drawings, side-by-side listing dossiers, and pure mechanical inspection controls (eliminating photo clutter while keeping connections, multiplayer, cloud saves, and metrics).
2. **Immersive 3D Mode (Toronto, CA)**: Transforms the entire experience into a fully interactive 3D automotive environment set in Toronto, featuring the iconic CN Tower skyline, realistic 3D procedural vehicle models across all 9 classes, driveable physics with third-person chase camera, walkable dealership lot, and full functional parity for meeting sellers, test driving, diagnosing, negotiating, and purchasing.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 interactive clarification:
> - **Navigation in 3D Mode**: Third-person navigable dealership lot with Toronto CN Tower skyline and realistic driveable vehicles.
> - **2D Mode Vehicle Silhouettes**: Minimal monochrome blueprint drawings exactly matching the classic *Lot & Ledger v1.5* vector styling.
> - **3D World Scale & Gameplay**: Complete 3D interactive city environment and dealership lot set exclusively in Toronto, Canada with driveable vehicles and inspectable realistic car components.

---

## 1. Overview & Core Concept

### 2D Mode: Classic Technical Auto Ledger
- **Visual Style**: Clean, high-density ledger aesthetic inspired by ruled paper, technical automotive blueprints, and mechanical specification sheets.
- **Marketplace**: Restores the original v1.5 layout with classic SVG car silhouettes (differentiated by body class: compact, sedan, SUV, truck, van, sports car, luxury, convertible, hatchback), clear inspection buttons (Walk-around, Test drive, OBD-II, PPI, History report, Mechanic friend, Compression test), and rapid keyboard/mouse negotiation sliders.
- **Zero Photo Dependencies**: Focuses on raw numbers, condition grades, and diagnostic readouts.

### 3D Mode: Toronto Automotive Tycoon
- **Visual Style**: A realistic Three.js PBR 3D world situated in Toronto along the Lake Ontario waterfront, with downtown skyscrapers, glowing streetlights, asphalt roads, and the illuminated CN Tower.
- **Interactive Dealership & Car Lots**:
  - Walkable showroom floor, outdoor gravel/pavement lot, customer lounge, and service bays.
  - Interactive car props placed directly in physical parking stalls.
  - Walk up to any car to trigger physical walk-around inspections, pop the hood to inspect engine bays, plug in the OBD-II scanner, or take the car on a real driveable test circuit through the Toronto streets.
- **Driveable Vehicle System**: Third-person vehicle physics (accelerate, reverse, steer, brake, tire smoke, headlights) allowing players to test drive before purchasing and drive newly bought vehicles back to their personal garage lot.
- **Unified Progression & State**: Both 2D and 3D modes share the exact same underlying GameState, Firestore cloud saves, inventory, cash, connections, staff, and B2B wholesale network. Switching between 2D and 3D happens instantaneously with a single click.

---

## 2. User Experience & Visual Design

### A. Viewport Composition & Mode Switcher
- **Top Ribbon Mode Switcher**: A modern floating segmented control in the top navigation bar (`[ 2D Blueprint | 3D Toronto ]`) allowing immediate zero-latency switching at any point.
- **2D Mode Viewport**:
  - Restores the clean split layout: Filterable listing column on the left (with classic SVG silhouettes, tags, mileage, and price), sticky inspection dossier on the right.
  - Seamless dark/light theme switching with custom blueprint styling.
- **3D Mode Viewport**:
  - Full-screen 3D canvas with an ergonomic collapsible bottom dock HUD (zero viewport occlusion).
  - Floating minimap of the Toronto dealership and surrounding driving roads.
  - Live speedometer, tachometer, fuel, and diagnostic status overlay when inside a vehicle.
  - Interaction prompt (`[E] Inspect / Negotiate`, `[F] Drive Vehicle`, `[C] Change Camera`) when approaching physical vehicles on the lot.

### B. Procedural 3D City & Vehicle Architecture (Three.js)
```
┌────────────────────────────────────────────────────────────────────────┐
│                        3D TORONTO AUTOMOTIVE WORLD                     │
│                                                                        │
│  [CN Tower Skyline]         [Lake Shore Blvd]       [Skybox & Fog]     │
│          │                         │                      │            │
│          ▼                         ▼                      ▼            │
│  ┌───────────────┐         ┌───────────────┐      ┌─────────────────┐  │
│  │ Toronto City  │◄───────►│ Dealership Lot│◄────►│ Test Drive Track│  │
│  │ Skyscrapers   │         │ (Showroom/Bay)│      │ (City Circuit)  │  │
│  └───────────────┘         └───────┬───────┘      └─────────────────┘  │
│                                    │                                   │
│                  ┌─────────────────┴─────────────────┐                 │
│                  ▼                                   ▼                 │
│         ┌───────────────────┐               ┌───────────────────┐      │
│         │ Walkable Character│               │ Driveable Vehicle │      │
│         │ (3rd Person View) │               │ (Physics & Cam)   │      │
│         └───────────────────┘               └───────────────────┘      │
└────────────────────────────────────────────────────────────────────────┘
```

- **Procedural 3D Vehicles (3–12 Part PBR Groups)**:
  - Chassis with physically calibrated car paint (`MeshPhysicalMaterial` with clearcoat and subtle metalness).
  - Modeled wheels, rims, rubber tires with tread, headlights with working light cones, glass windshields with specular reflections, and detailed grilles.
  - Distinct body geometry for sedans, pickups, SUVs, sports cars, and vans matching the catalog.
- **Toronto Environment**:
  - Iconic CN Tower with observation pod and communications needle.
  - Commercial dealership showroom with glass curtain walls, neon dealership signage, polished concrete floor, and outdoor lot with asphalt, painted stall lines, and floodlights.
  - Surrounding Toronto street layout with street signs (Yonge St, Bay St, Lake Shore Blvd).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Shared Game Engine with View Delegation
- **Approach**: The core simulation (`engine.ts`, `valuation.ts`, `connections.ts`, `storage.ts`) remains 100% authoritative and framework-agnostic. Both `MarketView.tsx` (2D) and `TorontoWorld3D.tsx` (3D) call the exact same dispatch handlers (`onBuy`, `onInspect`, `onNegotiate`, `onRepair`).
- **Why**: Guarantees zero logic divergence, preserves all existing multiplayer and Cloud Firestore save slots, and prevents bugs where features work in one mode but not the other.

### Decision 2: Pure Procedural Three.js Assets (Zero 404s)
- **Approach**: All 3D vehicles, buildings, roads, signs, and landmarks are generated procedurally using Three.js geometries (`ExtrudeGeometry`, `CylinderGeometry`, `BoxGeometry`) with PBR textures generated via HTML5 canvas.
- **Why**: Conforms strictly to the Three.js skill directives—zero external `.glb` or `.gltf` asset downloads that could 404, fail in hermetic sandboxes, or cause long loading delays.

### Decision 3: Restoring Original v1.5 Blueprint Silhouettes in 2D
- **Approach**: Port the exact parametric `svgCar(cls, color)` vector renderer from `Lot___Ledger_v1.5__f8b4c601.html`, replacing external raster photo cards in 2D mode with clean, crisp SVG silhouettes.
- **Why**: Honors the user's explicit request to bring the marketplace back to its original streamlined, fast-paced format with zero photo distractions.

---

## 4. Technical Implementation Phases

### Phase 1: Dependencies & 2D Marketplace Silhouette Restoration
1. Install `three` and `@types/three` npm packages.
2. Build `SvgCarSilhouette.tsx` incorporating the authentic v1.5 polygon and path definitions for all 9 body styles.
3. Update `MarketView.tsx` in 2D mode to display the classic vector silhouettes, compact listing cards, and side-by-side inspection/dossier panels.
4. Ensure all purchasing, deposit, inspection, and negotiation controls work flawlessly.

### Phase 2: Toronto 3D Automotive Engine (`TorontoWorld3D.tsx`)
1. Implement the Three.js scene lifecycle with `RoomEnvironment`, `PMREMGenerator`, warm/cool directional lighting, and horizon fog.
2. Build procedural Toronto landmarks: CN Tower, commercial dealership buildings, parking stalls, roads, street lamps, and barriers.
3. Construct modular 3D vehicle generator creating realistic multi-part car meshes (`Chassis`, `Cab`, `Wheels`, `Windows`, `Headlights`, `EngineBay`) corresponding to active listings and player garage vehicles.
4. Implement smooth third-person vehicle driving physics (WASD / Arrow keys, steering smoothing, acceleration, braking, reverse) and walkable avatar navigation.

### Phase 3: 3D Interaction HUD & Operational Parity
1. Build collapsible bottom HUD with camera controls (`Follow Vehicle`, `Free Orbit`, `Walkable Avatar`).
2. Add interaction triggers: walk up to vehicles on the lot to view inspection popups, test drive on the Toronto street track, or open the negotiation desk.
3. Hook up vehicle purchase directly inside 3D mode: driving the newly purchased car into the player's personal service bay.

### Phase 4: Integration, Verification & Polish
1. Add the global `2D / 3D` mode switcher to `Navbar.tsx` and `WelcomeView.tsx`.
2. Verify full compatibility with Cloud Firestore saves, multiplayer B2B trading, and the new Tycoon Index metrics.
3. Run `lint_applet` and `compile_applet` to ensure zero compilation or type errors.
