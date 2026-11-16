/**
 * MADUNA FRONTEND CONFIGURATION
 * Mengatur API Base URL dan konstanta terpusat untuk seluruh halaman frontend
 */
(function() {
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname === "";
    
    // Ganti URL ini dengan URL API Backend Express/Supabase Anda yang sebenarnya
    const URL_BACKEND_ONLINE = "https://maduna-backend.vercel.app";

    // Jika dibuka di laptop gunakan localhost:5000, jika di Vercel gunakan URL Backend
    const API_BASE = isLocal
        ? "http://localhost:5000"
        : URL_BACKEND_ONLINE;

    const WHATSAPP_NUMBER = "6285391832772";

    window.API_BASE = API_BASE;
    window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
})();
