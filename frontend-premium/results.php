<?php
session_start();

// Check if user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
$userName = $_SESSION['user_name'] ?? 'Guest';

// Redirect to login if not authenticated
if (!$isLoggedIn) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Results - IntervuAI Pro</title>
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
                <a href="index.php" class="nav-link">
                    <i class="fas fa-home"></i>
                    <span>Dashboard</span>
                </a>
                <a href="results.php" class="nav-link active">
                    <i class="fas fa-chart-bar"></i>
                    <span>Results</span>
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
    <main class="premium-main" style="padding-top: 100px;">
        <!-- Results Section -->
        <section class="results-section" id="resultsSection">
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
                                <div class="score-bar-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass-card" style="margin-top: 2rem;">
                <h3 class="card-title">Key Strengths</h3>
                <ul id="strengthsList" style="list-style: none; padding: 0;">
                    <li style="padding: 0.5rem; color: var(--color-text-secondary);">Loading...</li>
                </ul>
            </div>

            <div class="glass-card" style="margin-top: 2rem;">
                <h3 class="card-title">Areas for Improvement</h3>
                <ul id="improvementsList" style="list-style: none; padding: 0;">
                    <li style="padding: 0.5rem; color: var(--color-text-secondary);">Loading...</li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 3rem;">
                <a href="index.php" class="btn-primary">
                    <i class="fas fa-home"></i>
                    <span>Back to Home</span>
                    <div class="btn-glow"></div>
                </a>
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
    <script src="assets/js/neural-bg.js"></script>
    <script src="assets/js/premium-app.js"></script>
    <script>
        // Load results on page load
        document.addEventListener('DOMContentLoaded', () => {
            showResults();
        });
    </script>
</body>
</html>
