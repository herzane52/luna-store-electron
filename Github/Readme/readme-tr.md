<p align="center">
  <img src="../Image/header.png" alt="header">
</p>

<h1 align="center">Luna Store (Electron Versiyonu)</h1>
<p align="center"><i>Arch Linux için Paket Yönetim Uygulaması</i></p>

<p align="center">
  <a href="https://archlinux.org"><img src="https://img.shields.io/badge/Platform-Arch_Linux-blue?style=flat-square&logo=arch-linux&logoColor=white" alt="Linux"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Framework-Electron-brightgreen?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <b><a href="../../readme.md">English</a> | <a href="readme-fr.md">Français</a> | <a href="readme-tr.md">Türkçe</a></b>
</p>

---

> **ÖNEMLİ NOT:** Bu proje, Electron'un yüksek bellek (RAM) kullanımı nedeniyle bu aşamada bırakılmıştır. Geliştirme süreci **Rust** diline portlanmış olup, proje yoluna **Tauri** altyapısıyla [luna-store](https://github.com/herzane52/luna-store) adresinden devam etmektedir (Geliştirme süreci devam ediyor). Bu repo, Electron sürecindeki ilk ve son kararlı halini temsil eder. 

**Bilgilendirme:**
- Bu sürüm artık yeni özellik geliştirmeler yapılmayacaktır.
- Geliştirme süreci yalnızca kritik hata düzeltmeleri ve küçük kozmetik düzenlemelerle sınırlı kalacaktır.

---

## ✨ Özellikler

- 🎨 **Modern Arayüz:** Kullanıcı dostu ve estetik tasarım.
- 📦 **Kapsamlı Paket Yönetimi:** Pacman ve AUR paketlerini kolayca arayın, listeleyin, kurun veya kaldırın.
- 🐚 **Entegre Terminal:** İşlemleri gerçek zamanlı takip edebileceğiniz gömülü terminal desteği.
- 🔍 **Akıllı Arama:** Anlık sonuçlar ve kategorize edilmiş paket listeleri.
- 🌐 **Çoklu Dil Desteği:** 10 farklı dil seçeneği ile yerelleştirilmiş deneyim.

---

<h2 align="center">📸 Görseller</h2>

<p align="center">
      <img src="../Image/terminal.png" width="600" style="border-radius: 10px; margin: 5px;">
      <img src="../Image/updates.png" width="600" style="border-radius: 10px; margin: 5px;">
      <br>
      <img src="../Image/manager.png" width="600" style="border-radius: 10px; margin: 5px;">
</p>

---

## 🛠️ Kurulum ve Geliştirme

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

```bash
# Repoyu Klonlayın
git clone https://github.com/herzane52/luna-store-electron.git
cd luna-store-electron
```
```bash
# Bağımlılıkları Yükleyin 
npm install
```
Çalıştırmak için:
```bash
# Frontend ve Uygulamayı Başlatın
npm run next:dev   # Frontend
npm run electron   # Uygulama
```

Uygulamayı Derlemek (Build) için:
```bash
# Frontend'i derleyin
npm run next:build

# Linux (Pacman & AppImage) paketlerini oluşturun
npm run build:linux
```
---
<p align="center">
  Arch Linux topluluğuna sevgilerle. ❤️
</p>
