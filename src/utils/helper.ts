/**
 * Prüft, ob die Anwendung im Produktionsmodus läuft.
 * Nutzt die von Vite automatisch bereitgestellten Umgebungsvariablen.
 *
 * @returns {boolean} true, wenn die Anwendung im Produktionsmodus läuft
 */
export function isProductionMode(): boolean {
    try {
        return import.meta.env?.MODE === 'production';
    } catch (error) {
        console.warn('Konnte Umgebungsmodus nicht prüfen:', error);
        return false;
    }
}
