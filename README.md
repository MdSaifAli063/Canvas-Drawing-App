# Canvas Studio ✏️🎨

Beautiful, responsive HTML5 Canvas drawing app with a clean blue & white theme. Sketch freely, draw shapes, add text, toggle a grid, and export your artwork—right in the browser.

<div align="center">

![Static Badge](https://img.shields.io/badge/HTML5%20Canvas-%F0%9F%8E%A8-blue)
![Static Badge](https://img.shields.io/badge/Responsive-Yes-1e90ff)
![Static Badge](https://img.shields.io/badge/Theme-Blue%20%26%20White-2563eb)
![Static Badge](https://img.shields.io/badge/License-MIT-brightgreen)

</div>

---

## ✨ Features

- ✏️ Pen & 🧽 Eraser tools
- 📏 Shapes: Line, Rectangle, Square, Circle, Ellipse, Polygon (3–12 sides)
- 🔤 Text tool with font size and family
- ↩️ Undo / ↪️ Redo
- 🧵 Dashed strokes (length + gap)
- 🧰 Line cap styles (round, square, butt)
- 🟦 Stroke / 🟩 Fill colors + toggle fill on/off
- 🧭 Grid overlay toggle (G)
- 🖼️ Import image, 📥 Download PNG
- 💾 Save / Load from localStorage
- 🧹 Clear canvas
- 🖥️ Crisp rendering on high-DPI displays
- ⌨️ Keyboard shortcuts

---

## 🖼️ Screenshots

![Canvas Studio Screenshot](https://github.com/MdSaifAli063/Canvas-Drawing-App/blob/5fd826025efc81744236e65f1178668b5ffad866/Screenshot%202025-09-24%20004621.png)

---

## 📁 Project Structure


. ├── index.html # App UI ├── style.css # Blue & white theme + responsive layout └── script.js # Drawing logic & interactions


Ensure the paths in index.html match:
- <link rel="stylesheet" href="style.css" />
- <script src="script.js"></script>

---

## 🚀 Quick Start

Option A — Open directly:
1. Download all three files into the same folder.
2. Double-click index.html to open in your browser.

Option B — Serve locally (recommended for imports/saves on some browsers):
- Using Node
  - npx serve .
- Using Python
  - Python 3: python -m http.server 8000
  - Python 2: python -m SimpleHTTPServer 8000
- Visit http://localhost:8000

---

## 🧑‍🏫 How To Use

- Select a tool in the left panel.
- For shapes: click and drag to preview, release to place.
- For Pen/Eraser: click and drag to draw/erase.
- For Text: select Text, click canvas, type content in the “Content” field.
- Use controls to change colors, line width, dashes, and caps.
- Toggle Grid to aid alignment.
- Save to store a snapshot in your browser; Load to restore it later.
- Download exports your canvas as a PNG.

---

## ⌨️ Keyboard Shortcuts

- Ctrl/Cmd + Z → Undo ↩️
- Ctrl/Cmd + Y → Redo ↪️
- P → Pen ✏️
- E → Eraser 🧽
- T → Text 🔤
- G → Toggle Grid 🧭

---

## 🎛️ Settings Overview

- Stroke & Style
  - Line Width slider
  - Line Cap: round | square | butt
  - Dash Length / Gap
  - XOR blend (experimental)
- Colors
  - Stroke / Fill color
  - Fill shapes/text toggle
  - Background color (changes clear the canvas)
- Polygon
  - Sides: 3–12
- Text
  - Content
  - Font Size
  - Font Family (Inter, Arial, Georgia, Courier New)
- Utility
  - Reset Settings (restores defaults)

---

## 🧩 Customization

Theme colors live in CSS variables (style.css: :root):
- --primary, --accent, --accent-2
- --bg, --surface, --muted
- --text, --text-muted, --danger

Adjust these to retheme the app. Example:
- --accent: #2563eb;  /* blue-600 */

Canvas size adapts to the container; internal rendering scales for DPR.

---

## 🛠️ Troubleshooting

- Import local images not appearing:
  - Use a local server (see Quick Start Option B) due to browser file:// restrictions.
- Blurry lines:
  - The app uses device-pixel-ratio scaling. Ensure your browser zoom is 100%.
- Undo/Redo disabled:
  - Buttons enable after at least one history snapshot (draw something first).
- Save/Load not working:
  - Check that localStorage is enabled and not full/private-mode-restricted.

---

## 🌐 Browser Support

- Chrome, Edge, Firefox, Safari (latest two versions)
- Desktop and mobile touch support included

---

## 📜 License

MIT © Your Name

---

## 🙌 Credits

- Built with HTML5 Canvas
- Default font stack: Inter, system-ui, Arial, sans-serif

Enjoy creating! ✨
