const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class SettingsManager {
    constructor() {
        // 'settings.json' isminden kaçınmak için gizli bir dosya ismi kullanıyoruz
        this.settingsPath = path.join(app.getPath('userData'), '.luna_config.dat');
        this.defaults = {
            theme: 'dark',
            language: 'tr',
            defaultPage: 'manager',
            setupComplete: false,
            preferredPackageManager: 'pacman',
            customAccentColor: '#3b82f6',
            windowManager: 'auto',
            distro: 'unknown',
            packageManagers: {
                pacman: false,
                yay: false,
                paru: false,
            }
        };
        this.settings = null;
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                this.settings = { ...this.defaults, ...JSON.parse(data) };
            } else {
                this.settings = { ...this.defaults };
                this.save();
            }
        } catch (error) {
            console.error('SettingsManager: Error loading settings:', error);
            this.settings = { ...this.defaults };
        }
    }

    save(newSettings = {}) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
            return true;
        } catch (error) {
            console.error('SettingsManager: Error saving settings:', error);
            return false;
        }
    }

    get() {
        if (!this.settings) this.load();
        return this.settings;
    }

    reset() {
        this.settings = { ...this.defaults };
        this.save();
        return this.settings;
    }

    clearCaches() {
        const iconCache = path.join(app.getPath('userData'), 'icon-cache.json');
        const appCache = path.join(app.getPath('userData'), 'data', 'app-cache.json');

        try {
            if (fs.existsSync(iconCache)) fs.unlinkSync(iconCache);
            if (fs.existsSync(appCache)) fs.unlinkSync(appCache);
            return { success: true };
        } catch (error) {
            console.error('SettingsManager: Error clearing caches:', error);
            return { success: false, error: error.message };
        }
    }
}


const instance = new SettingsManager();
module.exports = instance;

