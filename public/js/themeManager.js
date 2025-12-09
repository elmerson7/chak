/**
 * Gestor de temas para CHAK
 * Maneja el cambio de temas y la persistencia en localStorage
 */

class ThemeManager {
    constructor() {
        this.themes = ['actual', 'documentos', 'terminal', 'codigo', 'dashboard'];
        this.modes = ['light', 'dark'];
        this.currentTheme = 'actual';
        this.currentMode = 'light';
        
        // Cargar preferencias guardadas
        this.loadPreferences();
    }
    
    /**
     * Carga las preferencias desde localStorage
     */
    loadPreferences() {
        const savedTheme = localStorage.getItem('chak_theme');
        const savedMode = localStorage.getItem('chak_mode');
        
        if (savedTheme && this.themes.includes(savedTheme)) {
            this.currentTheme = savedTheme;
        }
        
        if (savedMode && this.modes.includes(savedMode)) {
            this.currentMode = savedMode;
        }
        
        // Aplicar tema cargado
        this.applyTheme();
    }
    
    /**
     * Guarda las preferencias en localStorage
     */
    savePreferences() {
        localStorage.setItem('chak_theme', this.currentTheme);
        localStorage.setItem('chak_mode', this.currentMode);
    }
    
    /**
     * Establece el tema actual
     * @param {string} theme - Nombre del tema
     */
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.error(`Tema "${theme}" no válido`);
            return;
        }
        
        this.currentTheme = theme;
        this.applyTheme();
        this.savePreferences();
    }
    
    /**
     * Establece el modo (claro/oscuro)
     * @param {string} mode - 'light' o 'dark'
     */
    setMode(mode) {
        if (!this.modes.includes(mode)) {
            console.error(`Modo "${mode}" no válido`);
            return;
        }
        
        this.currentMode = mode;
        this.applyTheme();
        this.savePreferences();
    }
    
    /**
     * Aplica el tema actual al body
     */
    applyTheme() {
        const body = document.body;
        
        // Remover todas las clases de tema y modo
        this.themes.forEach(theme => {
            body.classList.remove(`theme-${theme}`);
        });
        this.modes.forEach(mode => {
            body.classList.remove(`mode-${mode}`);
        });
        
        // Aplicar clases actuales
        body.classList.add(`theme-${this.currentTheme}`);
        body.classList.add(`mode-${this.currentMode}`);
        
        // Disparar evento personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                mode: this.currentMode
            }
        }));
    }
    
    /**
     * Obtiene el tema actual
     * @returns {Object} { theme: string, mode: string }
     */
    getCurrentTheme() {
        return {
            theme: this.currentTheme,
            mode: this.currentMode
        };
    }
    
    /**
     * Obtiene la lista de temas disponibles
     * @returns {Array} Lista de nombres de temas
     */
    getThemes() {
        return this.themes;
    }
    
    /**
     * Obtiene la lista de modos disponibles
     * @returns {Array} Lista de modos
     */
    getModes() {
        return this.modes;
    }
}

// Crear instancia global
window.themeManager = new ThemeManager();

