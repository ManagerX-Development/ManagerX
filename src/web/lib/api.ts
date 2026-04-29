// @ts-expect-error - import.meta is handled by Vite
export const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? "http://localhost:8040" 
        : "https://api.managerx-bot.de");
