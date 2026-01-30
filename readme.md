<p align="center">
  <img src="Github/Image/header.png" alt="header">
</p>

<h1 align="center">Luna Store (Electron Version)</h1>
<p align="center"><i>Package Management Application for Arch Linux</i></p>

<p align="center">
  <a href="https://archlinux.org"><img src="https://img.shields.io/badge/Platform-Arch_Linux-blue?style=flat-square&logo=arch-linux&logoColor=white" alt="Linux"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Framework-Electron-brightgreen?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <b><a href="readme.md">English</a> | <a href="Github/Readme/readme-fr.md">Français</a> | <a href="Github/Readme/readme-tr.md">Türkçe</a></b>
</p>

---

> **IMPORTANT NOTE:** This project has been discontinued at this stage due to the high memory (RAM) usage of Electron. The development process has been ported to the **Rust** language and continues with the **Tauri** infrastructure at [luna-store](https://github.com/herzane52/luna-store) (Development is ongoing). This repo represents the first and last stable state of the Electron process. 

**Information:**
- New feature developments will no longer be made for this version.
- The development process will be limited to critical bug fixes and minor cosmetic adjustments only.

---

## ✨ Features

- 🎨 **Modern Interface:** Aesthetic and user-friendly design.
- 📦 **Comprehensive Package Management:** Easily search, list, install, or remove Pacman and AUR packages.
- 🐚 **Integrated Terminal:** Embedded terminal experience to track operations in real-time.
- 🔍 **Smart Search:** Instant results and categorized package listings.
- 🌐 **Multi-language Support:** Support for 10 different languages with a localized experience.

---

<h2 align="center">📸 Screenshots</h2>

<p align="center">
      <img src="Github/Image/terminal.png" width="600" style="border-radius: 10px; margin: 5px;">
      <img src="Github/Image/updates.png" width="600" style="border-radius: 10px; margin: 5px;">
      <br>
      <img src="Github/Image/manager.png" width="600" style="border-radius: 10px; margin: 5px;">
</p>

---

<h2 align="center">🛠️ Installation and Running</h2>

You can follow the steps below to run the project on your local machine:

```bash
# Clone the Repo
git clone https://github.com/herzane52/luna-store-electron.git
cd luna-store-electron
```
```bash
# Install Dependencies
npm install
```
To run:
```bash
# Start Frontend and Application
npm run next:dev   # Frontend
npm run electron   # Application
```

To Build the Application:
```bash
# Build the Frontend
npm run next:build

# Generate Linux (Pacman & AppImage) packages
npm run build:linux
```
---
<p align="center">
  With love to the Arch Linux community. ❤️
</p>
