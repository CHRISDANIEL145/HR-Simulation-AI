// API Configuration
// Change this to your production URL when deploying
const API_CONFIG = {
    // Base URL for API calls
    // Development: Python backend runs on port 5000
    // Production: 'https://your-domain.com/api'
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin,
    
    // Timeout for API requests (in milliseconds)
    TIMEOUT: 30000,
    
    // Session storage key
    SESSION_KEY: 'hr_ai_session_id'
};

// Helper function to get API URL
function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}/${endpoint.replace(/^\//, '')}`;
}

// Export for use in other modules
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
