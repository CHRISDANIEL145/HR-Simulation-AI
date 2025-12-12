// API Configuration for HuggingFace Spaces
const API_CONFIG = {
    BASE_URL: '',  // Same origin
    TIMEOUT: 30000,
    SESSION_KEY: 'hr_ai_session_id'
};

function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}/${endpoint.replace(/^\//, '')}`;
}

window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
