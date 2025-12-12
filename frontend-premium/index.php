<?php
session_start();

// Check if user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
$userName = $_SESSION['user_name'] ?? 'Guest';

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: login.php');
    exit;
}

// Redirect to login if not authenticated
if (!$isLoggedIn && !in_array(basename($_SERVER['PHP_SELF']), ['login.php', 'signup.php'])) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IntervuAI Pro - Next-Gen AI Interview Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/premium.css">
</head>
<body>
    <!-- Animated Background -->
    <div class="premium-bg">
        <div class="gradient-mesh"></div>
        <div class="neural-network">
            <canvas id="neuralCanvas"></canvas>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="premium-nav">
        <div class="nav-container">
            <div class="nav-brand">
                <div class="brand-icon">
                    <i class="fas fa-brain"></i>
                </div>
                <span class="brand-text">IntervuAI<span class="brand-pro">Pro</span></span>
            </div>
            <div class="nav-menu">
                <a href="index.php" class="nav-link active">
                    <i class="fas fa-home"></i>
                    <span>Dashboard</span>
                </a>
                <a href="feedback.php" class="nav-link">
                    <i class="fas fa-comment-dots"></i>
                    <span>Feedback</span>
                </a>
                <div class="nav-user">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-info">
                        <span class="user-name"><?php echo htmlspecialchars($userName); ?></span>
                        <span class="user-role">Premium User</span>
                    </div>
                    <a href="?logout=1" class="logout-btn" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="premium-main">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-content">
                <div class="hero-badge">
                    <i class="fas fa-sparkles"></i>
                    <span>Powered by Advanced AI</span>
                </div>
                <h1 class="hero-title">
                    Next-Generation
                    <span class="gradient-text">AI Interview</span>
                    Platform
                </h1>
                <p class="hero-subtitle">
                    Experience intelligent candidate evaluation with real-time AI analysis,
                    automated scoring, and comprehensive insights.
                </p>
                <div class="hero-actions">
                    <button class="btn-primary" onclick="scrollToUpload()">
                        <i class="fas fa-rocket"></i>
                        <span>Start Interview</span>
                        <div class="btn-glow"></div>
                    </button>
                    <button class="btn-secondary">
                        <i class="fas fa-play-circle"></i>
                        <span>Watch Demo</span>
                    </button>
                </div>
                <div class="hero-stats">
                    <div class="stat-item">
                        <div class="stat-value">10K+</div>
                        <div class="stat-label">Interviews</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-value">98%</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-value">AI</div>
                        <div class="stat-label">Detection</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Upload Section -->
        <section class="upload-section" id="uploadSection">
            <div class="glass-card large">
                <div class="card-header">
                    <div class="header-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="header-content">
                        <h2 class="card-title">Upload Resume</h2>
                        <p class="card-subtitle">AI-powered resume analysis in seconds</p>
                    </div>
                </div>
                
                <div class="upload-area" id="uploadArea">
                    <input type="file" id="resumeInput" accept=".pdf,.doc,.docx" hidden>
                    <div class="upload-icon">
                        <i class="fas fa-file-upload"></i>
                    </div>
                    <h3 class="upload-title">Drop your resume here</h3>
                    <p class="upload-text">or click to browse</p>
                    <div class="upload-formats">
                        <span class="format-badge">PDF</span>
                        <span class="format-badge">DOC</span>
                        <span class="format-badge">DOCX</span>
                    </div>
                    <div class="upload-progress hidden" id="uploadProgress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text">Analyzing...</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Interview Section (Hidden initially) -->
        <section class="interview-section hidden" id="interviewSection">
            <div class="glass-card">
                <div class="interview-header">
                    <div class="progress-indicator">
                        <div class="progress-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45"></circle>
                                <circle cx="50" cy="50" r="45" class="progress-ring"></circle>
                            </svg>
                            <span class="progress-number">1/15</span>
                        </div>
                    </div>
                    <div class="timer">
                        <i class="fas fa-clock"></i>
                        <span id="timer">00:00</span>
                    </div>
                </div>
                
                <div class="question-container">
                    <div class="question-tags">
                        <span class="tag">Technical</span>
                        <span class="tag">Problem Solving</span>
                    </div>
                    <h3 class="question-text" id="questionText">
                        Loading question...
                    </h3>
                </div>
                
                <div class="answer-container">
                    <textarea 
                        id="answerText" 
                        class="answer-input" 
                        placeholder="Type your response here..."
                        rows="8"
                    ></textarea>
                    <div class="ai-warning hidden" id="aiWarning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>AI-generated content detected</span>
                    </div>
                </div>
                
                <div class="interview-actions">
                    <button class="btn-secondary" onclick="resetInterview()">
                        <i class="fas fa-home"></i>
                        <span>Home</span>
                    </button>
                    <button class="btn-secondary" onclick="previousQuestion()">
                        <i class="fas fa-arrow-left"></i>
                        <span>Previous</span>
                    </button>
                    <button class="btn-primary" onclick="nextQuestion()">
                        <span>Next Question</span>
                        <i class="fas fa-arrow-right"></i>
                        <div class="btn-glow"></div>
                    </button>
                </div>
            </div>
        </section>

        <!-- Results Section (Hidden initially) -->
        <section class="results-section hidden" id="resultsSection">
            <div class="results-header">
                <h2 class="section-title">Interview Assessment</h2>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn-secondary" onclick="downloadReportHTML()">
                        <i class="fas fa-file-code"></i>
                        <span>Download HTML</span>
                    </button>
                    <button class="btn-primary" onclick="downloadReportPDF()">
                        <i class="fas fa-file-pdf"></i>
                        <span>Download PDF</span>
                        <div class="btn-glow"></div>
                    </button>
                </div>
            </div>
            
            <div class="results-grid">
                <div class="glass-card">
                    <div class="score-display">
                        <div class="score-circle">
                            <svg viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="90"></circle>
                                <circle cx="100" cy="100" r="90" class="score-ring"></circle>
                            </svg>
                            <div class="score-content">
                                <span class="score-value" id="overallScore">--</span>
                                <span class="score-label">Overall</span>
                            </div>
                        </div>
                        <div class="recommendation" id="recommendation">
                            <i class="fas fa-hourglass-half"></i>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card">
                    <h3 class="card-title">Detailed Scores</h3>
                    <div class="score-breakdown">
                        <div class="score-item">
                            <div class="score-info">
                                <span class="score-name">Technical Skills</span>
                                <span class="score-percent">--%</span>
                            </div>
                            <div class="score-bar">
                                <div class="score-bar-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="score-item">
                            <div class="score-info">
                                <span class="score-name">Communication</span>
                                <span class="score-percent">--%</span>
                            </div>
                            <div class="score-bar">
                                <div class="score-bar-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="score-item">
                            <div class="score-info">
                                <span class="score-name">Soft Skills</span>
                                <span class="score-percent">--%</span>
                            </div>
                            <div class="score-bar">
                                <div class="score-bar-fill" style="width: 85%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Loading Overlay -->
    <div class="loading-overlay hidden" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-text">Processing with AI...</p>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface"></script>
    <script src="assets/js/config.js"></script>
    <script src="assets/js/neural-bg.js"></script>
    <script src="assets/js/exam-security.js"></script>
    <script src="assets/js/proctoring.js"></script>
    <script src="assets/js/premium-app.js"></script>
</body>
</html>
