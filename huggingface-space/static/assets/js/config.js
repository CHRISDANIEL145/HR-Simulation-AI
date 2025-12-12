// API Configuration for HuggingFace Spaces
const API_CONFIG = {
    // Base URL - same origin for HuggingFace deployment
    BASE_URL: window.location.origin,
    
    // Timeout for API requests (in milliseconds)
    TIMEOUT: 30000,
    
    // Session storage key
    SESSION_KEY: 'hr_ai_session_id'
};

// Helper function to get API URL
function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}/${endpoint.replace(/^\//, '')}`;
}

// Session ID management
function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// Export for use in other modules
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
window.getSessionId = getSessionId;
