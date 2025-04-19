# 🗺️ JR Pass Map Tool Roadmap

## ✅ Core (Now Complete)
- [x] Offline map with Leaflet + Docker container
- [x] GeoJSON file structure in place (`stations.geojson`, `jr_lines.geojson`)
- [x] Full MLIT-sourced JR network data filtered and downloaded
- [x] App scaffolding: `index.html`, `main.js`, `style.css`, `Dockerfile`

---

## 🔜 V1 Completion Goals
🎯 Minimal fully working offline tool
- [ ] Load JR stations and lines onto the map
- [ ] Distinct line coloring based on `name`/`operator`
- [ ] Basic popup for station info (name + operator)
- [ ] Toggle: Geographic vs schematic view (map layout switcher)
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
