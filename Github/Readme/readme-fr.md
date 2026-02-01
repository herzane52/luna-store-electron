<p align="center">
  <img src="../Image/header.png" alt="header">
</p>

<h1 align="center">Luna Store (Version Electron)</h1>
<p align="center"><i>Application de Gestion de Paquets Moderne et Rapide pour Arch Linux</i></p>

<p align="center">
  <a href="https://archlinux.org"><img src="https://img.shields.io/badge/Platform-Arch_Linux-blue?style=flat-square&logo=arch-linux&logoColor=white" alt="Linux"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Framework-Electron-brightgreen?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <b><a href="../../readme.md">English</a> | <a href="readme-fr.md">Français</a> | <a href="readme-tr.md">Türkçe</a></b>
</p>

---

## ✨ Caractéristiques

- 🎨 **Interface Moderne :** Options de couleurs personnalisables, support du mode sombre et design esthétique haut de gamme.
- 📦 **Gestion des Paquets :** Suivez facilement les paquets installés, installez de nouveaux paquets en un clic ou supprimez-les du système (page Manager).
- 🔄 **Mises à Jour du Système :** Suivi instantané de toutes les mises à jour dans les dépôts et possibilité de mise à jour groupée en un clic.
- 🔍 **Recherche Intelligente :** Recherche rapide dans les dépôts Pacman et AUR, filtrage par catégorie et informations détaillées sur les paquets.
- 🐚 **Terminal Intégré :** Console intégrée performante pour suivre tous les processus d'installation et de suppression en temps réel.
- 🌐 **Support Linguistique :** Actuellement disponible en **Turc, Anglais et Français**.
- 🛠️ **Outils de Gestion :** Outils utilitaires pour nettoyer les paquets orphelins et optimiser le système.

---

## 🚀 Environnements Testés

L'application a été testée personnellement et fonctionne parfaitement dans l'environnement suivant :
- **Système d'Exploitation :** Arch Linux
- **Environnement de Bureau :** KDE Plasma
- **Serveur d'Affichage :** Wayland

> [!NOTE]
> L'application devrait également fonctionner sur d'autres environnements de bureau (GNOME, XFCE, etc.) et sur X11 ; veuillez signaler tout problème rencontré.

---

## 📦 Conditions Requises

Pour faire fonctionner l'application, une **distribution basée sur Arch Linux** (Manjaro, EndeavourOS, etc.) et les paquets suivants sont requis :

- `pacman` (Gestionnaire de paquets système)
- `pacman-contrib` (Requis pour la vérification des mises à jour)
- `polkit` / `pkexec` (Requis pour l'authentification)
- `yay` ou `paru` (Recommandé pour le support AUR)

---

<h2 align="center">📸 Captures d'écran</h2>

<p align="center">
      <img src="../Image/terminal.png" width="800" style="border-radius: 10px; margin: 10px;">
      <br>
      <img src="../Image/updates.png" width="800" style="border-radius: 10px; margin: 10px;">
      <br>
      <img src="../Image/manager.png" width="800" style="border-radius: 10px; margin: 10px;">
</p>

---

## 🛠️ Installation et Développement

Pour exécuter ou packager le projet sur votre machine locale :

### 1. Préparation
```bash
# Cloner le dépôt
git clone https://github.com/herzane52/luna-store-electron.git
cd luna-store-electron

# Installer les dépendances
npm install
```

### 2. Mode Développement
```bash
# Terminal 1 : Lancer le serveur de développement Frontend (Next.js)
npm run next:dev

# Terminal 2 : Lancer l'Application (Electron)
npm run electron
```

> Le serveur de développement (`next:dev`) peut prendre un certain temps à être prêt. Veuillez vous assurer que le serveur est complètement opérationnel (Ready) dans le terminal avant de lancer Electron, sinon vous pourriez rencontrer des erreurs de connexion.

### 3. Empaquetage (Build)
```bash
# Compiler d'abord le frontend
npm run next:build

# Générer les paquets Linux (.pacman, .AppImage)
npm run build:linux
```

---

## 📄 Licence
Ce projet est protégé par la licence **GPL-3.0**. Pour plus d'informations, vous pouvez consulter le fichier [LICENSE](../LICENSE).

<p align="center">
  Avec amour pour la communauté Arch Linux. ❤️
</p>
