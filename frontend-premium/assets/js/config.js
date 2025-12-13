// IntervuAI Pro - Configuration

const CONFIG = {
    API_BASE_URL: '',
    SESSION_KEY: 'intervuai_session',
    TOTAL_QUESTIONS: 15,
    TIME_PER_QUESTION: 300,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FILE_TYPES: ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SCORE_EXCELLENT: 85,
    SCORE_GOOD: 70,
    SCORE_AVERAGE: 50
};

function getSessionId() {
    let sessionId = sessionStorage.getItem(CONFIG.SESSION_KEY);
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem(CONFIG.SESSION_KEY, sessionId);
    }
    return sessionId;
}

async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-User-Session-Id': getSessionId()
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + endpoint, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'X-User-Session-Id': getSessionId() },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}
