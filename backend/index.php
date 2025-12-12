<?php
session_start();

// Load environment variables
require_once 'config.php';
require_once 'functions.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Session-Id');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize session data if not exists
if (!isset($_SESSION['sessions'])) {
    $_SESSION['sessions'] = [];
}

// Get session ID from header or create new one
$sessionId = $_SERVER['HTTP_X_USER_SESSION_ID'] ?? uniqid('session_', true);

// Get or create session
function getOrCreateSession($sessionId) {
    if (!isset($_SESSION['sessions'][$sessionId])) {
        $_SESSION['sessions'][$sessionId] = [
            'candidate_profile' => null,
            'interview_questions' => [],
            'interview_responses' => [],
            'interview_start_time' => null,
            'interview_end_time' => null
        ];
    }
    return $_SESSION['sessions'][$sessionId];
}

// Serve static files
$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Serve frontend
if ($requestPath === '/' || $requestPath === '/index.php') {
    $indexPath = __DIR__ . '/../frontend/public/index.html';
    if (file_exists($indexPath)) {
        header('Content-Type: text/html');
        readfile($indexPath);
        exit;
    }
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $action = $_SERVER['REQUEST_URI'];
    
    if ($action === '/upload_resume') {
        handleResumeUpload($sessionId);
    } elseif ($action === '/setup_interview') {
        handleInterviewSetup($sessionId);
    } elseif ($action === '/submit_answer') {
        handleSubmitAnswer($sessionId);
    } else {
        echo json_encode(['error' => 'Invalid endpoint']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $requestPath === '/get_assessment') {
    header('Content-Type: application/json');
    handleGetAssessment($sessionId);
    exit;
}

// 404
http_response_code(404);
echo '404 - Not Found';
