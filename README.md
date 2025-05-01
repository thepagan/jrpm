# 🗺️ JR Pass Map Tool Roadmap

## ✅ Core (Now Complete)
- [x] Offline map with Leaflet + Docker container
- [x] GeoJSON file structure in place (`stations.geojson`, `jr_lines.geojson`)
- [x] Full MLIT-sourced JR network data filtered and downloaded
- [x] App scaffolding: `index.html`, `main.js`, `style.css`, `Dockerfile`

---

## 🔜 V1 Completion Goals
🎯 Minimal fully working offline tool
- [x] Load JR stations and lines onto the map
- [x] Distinct line coloring based on `name`/`operator`
- [x] Basic popup for station info (name + operator)
- [x] Toggle: Geographic vs schematic view (map layout switcher)
- [ ] Nozomi/Mizuho toggle to hide excluded trains
- [ ] Static legend for color-coded lines

---

## 🌟 V2 Goals – Enhanced UX
- [ ] Scenic route highlighting (tagged lines)
- [ ] Green Car styling (line glow or icon)
- [ ] Fox mascot loading animation 🦊
- [ ] Major tourist hubs with special icons (Kyoto, Tokyo, etc.)
- [ ] Click-to-highlight full line segments

---

## 🧠 V3+ Advanced Features (Roadmap Bank)
- [ ] Route planner with start/end stations and estimated ride length
- [ ] Option to create calendar reminders when ticket reservations open
- [ ] Station sign images shown in the route planner
- [ ] GPS-guided walking directions inside major stations
- [ ] Language toggle + browser detection
- [ ] Fox assistant tips (e.g. “you’ve got time for a bento!” 🍱)
- [ ] Zorrito-style mascot integration with outfits, moods, or weather-reactive states
- [ ] Save/print/share planned routes
- [ ] Mobile-friendly responsive interface


🛠 Future Upgrade: Bundler Setup
	•	Install and configure Vite or Rollup for the JR Pass Map project.
	•	Build all modular JavaScript (map.js, lines.js, stations.js, etc.) into one minimized bundle.js.
	•	Update index.html to load only bundle.js instead of individual scripts.
	•	Set up build scripts (npm run build) for easy regeneration.
	•	(Optional) Minify CSS at the same time for faster load.

⸻

🔒 Future Upgrade: Structure Hiding
	•	Hide /static/js/ structure from direct browser access by not serving raw JS files.
	•	Only serve compressed dist/ output (e.g., bundle.js, bundle.css).
	•	Add .gitignore rules to avoid committing raw node_modules or sensitive dev files.
	•	(Optional Advanced) Enable server-level restrictions to deny access to raw JS during production deployment.