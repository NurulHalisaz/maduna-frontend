/**
 * MADUNA FRONTEND CONFIGURATION
 * Mengatur API Base URL dan konstanta terpusat untuk seluruh halaman frontend
 */
(function() {
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname === "";
    
    // Jika frontend dibuka langsung via port lain (misal 5500), arahkan ke backend port 5000
    const API_BASE = isLocal
        ? "http://localhost:5000"
        : `${window.location.protocol}//${window.location.hostname}`;

    const WHATSAPP_NUMBER = "6285391832772";

    window.API_BASE = API_BASE;
    window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
})();

