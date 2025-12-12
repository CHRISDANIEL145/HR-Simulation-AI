<?php
session_start();

// Initialize session data if not exists
if (!isset($_SESSION['interview_data'])) {
    $_SESSION['interview_data'] = [
        'candidate_profile' => null,
        'interview_questions' => [],
        'interview_responses' => [],
        'interview_start_time' => null,
        'interview_end_time' => null,
        'interview_assessment' => null
    ];
}

// Load configuration and functions
require_once __DIR__ . '/backend/config.php';
require_once __DIR__ . '/backend/functions.php';

// Handle AJAX API requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
    
    header('Content-Type: application/json');
    
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'upload_resume':
            handleResumeUpload();
            break;
        case 'setup_interview':
            handleInterviewSetup();
            break;
        case 'submit_answer':
            handleSubmitAnswer();
            break;
        case 'get_assessment':
            handleGetAssessment();
            break;
        case 'reset_interview':
            session_destroy();
            session_start();
            $_SESSION['interview_data'] = [
                'candidate_profile' => null,
                'interview_questions' => [],
                'interview_responses' => [],
                'interview_start_time' => null,
                'interview_end_time' => null,
                'interview_assessment' => null
            ];
            echo json_encode(['success' => true]);
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
    exit;
}

// Serve the frontend HTML
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IntervuAI Pro - AI-Powered Interview Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="frontend/assets/css/style.css">
</head>
<body>
    <!-- Animated Background -->
    <div class="animated-bg">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
    </div>

    <!-- Main Container -->
    <div class="main-container">
        <!-- Header -->
        <header class="app-header">
            <div class="header-content">
                <div class="logo-section">
                    <div class="logo-icon">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="logo-text">
                        <h1>IntervuAI Pro</h1>
                        <p>AI-Powered Interview Platform</p>
                    </div>
                </div>
                <div class="header-actions">
                    <span class="version-badge">Unified v1.0</span>
                </div>
            </div>
        </header>

        <!-- Content Area -->
        <main class="content-area" id="app-content">
            <!-- Content will be dynamically loaded here -->
        </main>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div style="text-align: center;">
            <div class="spinner"></div>
            <p style="font-size: 18px; font-weight: 600; color: var(--primary-color);" id="loadingMessage">Processing...</p>
        </div>
    </div>

    <!-- Custom Alert Modal -->
    <div class="modal-overlay" id="customAlert">
        <div class="modal-box">
            <div class="modal-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3 id="customAlertTitle" style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">Alert</h3>
            <p id="customAlertMessage" style="font-size: 16px; color: var(--text-secondary); margin-bottom: 24px;">Something went wrong.</p>
            <button class="btn btn-primary" id="customAlertClose">OK</button>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script src="frontend/assets/js/app.js"></script>
</body>
</html>
