<p align="center">
  <img src="../Image/header.png" alt="header">
</p>

<h1 align="center">Luna Store (Version Electron)</h1>
<p align="center"><i>Application de gestion de paquets pour Arch Linux</i></p>

<p align="center">
  <a href="https://archlinux.org"><img src="https://img.shields.io/badge/Platform-Arch_Linux-blue?style=flat-square&logo=arch-linux&logoColor=white" alt="Linux"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Framework-Electron-brightgreen?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <b><a href="../../readme.md">English</a> | <a href="readme-fr.md">Français</a> | <a href="readme-tr.md">Türkçe</a></b>
</p>

---

> **NOTE IMPORTANTE :** Ce projet a été abandonné à ce stade en raison de l'utilisation élevée de la mémoire (RAM) d'Electron. Le processus de développement a été porté vers le langage **Rust** et se poursuit avec l'infrastructure **Tauri** à l'adresse [luna-store](https://github.com/herzane52/luna-store) (Le développement est en cours). Ce dépôt représente le premier et le dernier état stable du processus Electron. 

**Information :**
- Aucun nouveau développement de fonctionnalités ne sera effectué pour cette version.
- Le processus de développement sera limité uniquement aux corrections de bugs critiques et aux ajustements cosmétiques mineurs.

---

## ✨ Caractéristiques

- 🎨 **Interface Moderne :** Design esthétique et convivial.
- 📦 **Gestion Complète des Paquets :** Recherchez, listez, installez ou supprimez facilement des paquets Pacman et AUR.
- 🐚 **Terminal Intégré :** Expérience de terminal intégrée pour suivre les opérations en temps réel.
- 🔍 **Recherche Intelligente :** Résultats instantanés et listes de paquets catégorisées.
- 🌐 **Support Multilingue :** Prise en charge de 10 langues différentes avec une expérience localisée.

---

<h2 align="center">📸 Captures d'écran</h2>

<p align="center">
      <img src="../Image/terminal.png" width="600" style="border-radius: 10px; margin: 5px;">
      <img src="../Image/updates.png" width="600" style="border-radius: 10px; margin: 5px;">
      <br>
      <img src="../Image/manager.png" width="600" style="border-radius: 10px; margin: 5px;">
</p>

---

<h2 align="center">🛠️ Installation et Exécution</h2>

S'il vous plaît suivez les étapes ci-dessous pour exécuter le projet sur votre machine locale :

```bash
# Cloner le dépôt
git clone https://github.com/herzane52/luna-store-electron.git
cd luna-store-electron
```
```bash
# Installer les dépendances
npm install
```
Pour exécuter :
```bash
# Démarrer le Frontend et l'Application
npm run next:dev   # Frontend
npm run electron   # Application
```

Pour compiler l'application :
```bash
# Compiler le Frontend
npm run next:build

# Générer les paquets Linux (Pacman & AppImage)
npm run build:linux
```
---
<p align="center">
  Avec amour pour la communauté Arch Linux. ❤️
</p>
