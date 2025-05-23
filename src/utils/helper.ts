import loggerService from "../services/logger.service.ts";

/**
 * Prüft, ob die Anwendung im Produktionsmodus läuft.
 * Nutzt die von Vite automatisch bereitgestellten Umgebungsvariablen.
 *
 * @returns {boolean} true, wenn die Anwendung im Produktionsmodus läuft
 */
export function isProductionMode(): boolean {
    try {
        // Vite definiert automatisch import.meta.env.PROD
        // Es ist sicherer, diese Variable zu verwenden
        if (typeof import.meta.env !== 'undefined') {
            return import.meta.env.PROD;
        }
        return false;

    } catch (error) {
        // Im Fehlerfall wird angenommen, dass wir nicht im Produktionsmodus sind
        loggerService.warn('Konnte Produktionsmodus nicht prüfen:', error);
        return false;
    }


}
