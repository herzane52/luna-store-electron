<p align="center">
  <img src="../Image/header.png" alt="header">
</p>

<h1 align="center">Luna Store (Electron Versiyonu)</h1>
<p align="center"><i>Arch Linux için Modern ve Hızlı Paket Yönetim Uygulaması</i></p>

> **ÖNEMLİ NOT:** Bu proje, Electron'un yüksek bellek (RAM) kullanımı nedeniyle bu aşamada bırakılmıştır. Geliştirme süreci **Rust** diline portlanmış olup, proje yoluna **Tauri** altyapısıyla [luna-store](https://github.com/herzane52/luna-store) adresinden devam etmektedir (Geliştirme süreci devam ediyor). Bu repo, Electron sürecindeki ilk ve son kararlı halini temsil eder. 


<p align="center">
  <a href="https://archlinux.org"><img src="https://img.shields.io/badge/Platform-Arch_Linux-blue?style=flat-square&logo=arch-linux&logoColor=white" alt="Linux"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Framework-Electron-brightgreen?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <b><a href="../../readme.md">English</a> | <a href="readme-tr.md">Türkçe</a></b>
</p>

---

## ✨ Özellikler

- 🎨 **Modern Arayüz:** Kişiselleştirilebilir renk seçenekleri, karanlık mod desteği ve premium hissettiren estetik tasarım.
- 📦 **Paket Yönetimi:** Kurulu paketleri kolayca izleme, yeni paketleri tek tıkla kurma veya sistemden kaldırma (Manager sayfası).
- 🔄 **Sistem Güncellemeleri:** Depolardaki tüm güncellemeleri anlık takip etme ve tek tıkla toplu güncelleme imkanı.
- 🔍 **Akıllı Arama:** Pacman ve AUR depolarında hızlı arama, kategori bazlı filtreleme ve detaylı paket bilgileri.
- 🐚 **Entegre Terminal:** Tüm yükleme ve kaldırma süreçlerini gerçek zamanlı izleyebileceğiniz performanslı gömülü terminal.
- 🌐 **Dil Desteği:** Şu an için **Türkçe, İngilizce, Fransızca, Almanca, İspanyolca, Portekizce, Rusça, İtalyanca ve Azerbaycan Türkçesi** dil seçenekleri mevcuttur. (Türkçe harici diller yapay zeka ile çevrilmiştir.)
- 🛠️ **Yönetim Araçları:** Yetim paketleri temizleme ve sistem optimizasyonu için yardımcı araçlar.

---

## 🚀 Test Edilen Ortamlar

Uygulama aşağıdaki ortamda bizzat test edilmiş ve sorunsuz çalışmaktadır:
- **İşletim Sistemi:** Arch Linux
- **Masaüstü Ortamı:** KDE Plasma
- **Görüntü Sunucusu:** Wayland

> [!NOTE]
> Diğer masaüstü ortamlarında (GNOME, XFCE vb.) ve X11 üzerinde de çalışması beklenmektedir ancak herhangi bir sorunla karşılaşırsanız lütfen bildirin.

---

## 📦 Gereksinimler

Uygulamanın çalışabilmesi için **Arch Linux tabanlı bir dağıtım** (Manjaro, EndeavourOS vb.) ve şu paketlerin yüklü olması gereklidir:

- `pacman` (Sistem paket yöneticisi)
- `pacman-contrib` (Güncelleme kontrolü için gereklidir)
- `polkit` / `pkexec` (Yetki onayları için gereklidir)
- `yay` veya `paru` (AUR desteği için önerilir)

---

<h2 align="center">📸 Görseller</h2>

<p align="center">
      <img src="../Image/terminal.png" width="800" style="border-radius: 10px; margin: 10px;">
      <br>
      <img src="../Image/updates.png" width="800" style="border-radius: 10px; margin: 10px;">
      <br>
      <img src="../Image/manager.png" width="800" style="border-radius: 10px; margin: 10px;">
</p>

---

## 🛠️ Kurulum ve Geliştirme

Projeyi yerel makinenizde çalıştırmak veya paketlemek için:

### 1. Hazırlık
```bash
# Repoyu klonlayın
git clone https://github.com/herzane52/luna-store-electron.git
cd luna-store-electron

# Bağımlılıkları yükleyin
npm install
```

### 2. Geliştirme Modu
```bash
# Terminal 1: Frontend (Next.js) dev sunucusunu başlatın
npm run next:dev

# Terminal 2: Uygulamayı (Electron) başlatın
npm run electron
```

> Geliştirme sunucusunun (`next:dev`) hazır olması biraz zaman alabilir. Lütfen terminalde sunucunun tamamen başladığından (Ready) emin olduktan sonra Electron'u başlatın, aksi takdirde bağlantı hatalarıyla karşılaşabilirsiniz.

### 3. Paketleme (Build)
```bash
# Önce frontend'i derleyin
npm run next:build

# Linux paketlerini (.pacman, .AppImage) oluşturun
npm run build:linux
```

---

## 📥 Kurulum (Son Kullanıcılar İçin)

Eğer projeyi geliştirmek yerine direkt kullanmak istiyorsanız:

1. **Pacman Yöntemi (Önerilen):**
   - [Releases](../../releases) sayfasından `.pacman` paketini indirin.
   - Terminalden şu komutu çalıştırın:
     ```bash
     sudo pacman -U luna-store-1.3.5.pacman
     ```
2. **AppImage Yöntemi:**
   - `.AppImage` dosyasını indirin.
   - Dosyaya sağ tıklayıp *Özellikler -> İzinler* kısmından "Çalıştırılabilir" olarak işaretleyin ve açın.

---

## 📄 Lisans
Bu proje **GPL-3.0** lisansı altında korunmaktadır. Daha fazla bilgi için [LICENSE](../../LICENSE) dosyasına göz atabilirsiniz.

<p align="center">
  Arch Linux topluluğuna sevgilerle. ❤️
</p>
