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
    <title>IntervuAI Pro - AI Interview Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/platform.css">
</head>
<body>
    <!-- Top Navigation Bar -->
    <header class="top-nav">
        <div class="nav-left">
            <a href="index.php" class="nav-logo">
                <i class="fas fa-brain"></i>
                <span>IntervuAI<span class="pro">Pro</span></span>
            </a>
            <div class="nav-divider"></div>
            <div class="nav-title">
                <i class="fas fa-list-check"></i>
                <span>AI Interview</span>
            </div>
            <div class="nav-arrows">
                <button class="nav-arrow" title="Previous"><i class="fas fa-chevron-left"></i></button>
                <button class="nav-arrow" title="Next"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
        <div class="nav-center">
            <button class="nav-btn run-btn" id="runBtn">
                <i class="fas fa-play"></i>
                <span>Run</span>
            </button>
            <button class="nav-btn submit-btn" id="submitBtn">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>Submit</span>
            </button>
        </div>
        <div class="nav-right">
            <button class="nav-icon-btn" title="Settings"><i class="fas fa-cog"></i></button>
            <button class="nav-icon-btn" title="Notifications">
                <i class="fas fa-bell"></i>
                <span class="notification-badge">0</span>
            </button>
            <div class="user-menu">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <span class="user-name"><?php echo htmlspecialchars($userName); ?></span>
                <a href="?logout=1" class="premium-badge">Logout</a>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="main-container">
        <!-- Left Panel - Problem Description -->
        <div class="panel left-panel" id="leftPanel">
            <div class="panel-header">
                <div class="panel-tabs">
                    <button class="panel-tab active" data-tab="description">
                        <i class="fas fa-file-alt"></i>
                        <span>Description</span>
                    </button>
                    <button class="panel-tab" data-tab="editorial">
                        <i class="fas fa-book"></i>
                        <span>Editorial</span>
                    </button>
                    <button class="panel-tab" data-tab="solutions">
                        <i class="fas fa-lightbulb"></i>
                        <span>Solutions</span>
                    </button>
                    <button class="panel-tab" data-tab="submissions">
                        <i class="fas fa-history"></i>
                        <span>Submissions</span>
                    </button>
                </div>
            </div>
            
            <div class="panel-content">
                <!-- Description Tab -->
                <div class="tab-content active" id="description-content">
                    <div class="problem-header">
                        <h1 class="problem-title">
                            <span class="problem-number">1.</span>
                            AI Interview Assessment
                        </h1>
                        <div class="problem-meta">
                            <span class="difficulty medium">Medium</span>
                            <button class="meta-btn"><i class="fas fa-tags"></i> Topics</button>
                            <button class="meta-btn"><i class="fas fa-building"></i> Companies</button>
                            <button class="meta-btn"><i class="fas fa-lightbulb"></i> Hint</button>
                        </div>
                    </div>
                    
                    <div class="problem-description">
                        <p>Welcome to the AI-powered interview assessment platform. This system evaluates candidates through a series of technical and behavioral questions.</p>
                        
                        <h3>Instructions:</h3>
                        <ol>
                            <li><strong>Upload Resume:</strong> Start by uploading your resume in PDF, DOC, or DOCX format.</li>
                            <li><strong>Answer Questions:</strong> The AI will generate personalized questions based on your resume.</li>
                            <li><strong>Code Challenges:</strong> Complete coding challenges in your preferred programming language.</li>
                            <li><strong>Get Results:</strong> Receive detailed feedback and scores upon completion.</li>
                        </ol>
                        
                        <h3>Evaluation Criteria:</h3>
                        <ul>
                            <li><code>Technical Skills</code> - Problem-solving and coding ability</li>
                            <li><code>Communication</code> - Clarity and structure of responses</li>
                            <li><code>Soft Skills</code> - Leadership, teamwork, and adaptability</li>
                        </ul>
                        
                        <div class="info-box">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <strong>Note:</strong> AI-generated responses are detected and may affect your score. Please provide authentic answers.
                            </div>
                        </div>
                    </div>
                    
                    <!-- Upload Section -->
                    <div class="upload-section" id="uploadSection">
                        <div class="upload-box" id="uploadBox">
                            <input type="file" id="resumeInput" accept=".pdf,.doc,.docx" hidden>
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <h3>Upload Your Resume</h3>
                            <p>Drag & drop or click to browse</p>
                            <div class="upload-formats">
                                <span>PDF</span>
                                <span>DOC</span>
                                <span>DOCX</span>
                            </div>
                        </div>
                        <div class="upload-progress hidden" id="uploadProgress">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <span>Analyzing resume...</span>
                        </div>
                    </div>
                </div>
                
                <!-- Editorial Tab -->
                <div class="tab-content" id="editorial-content">
                    <div class="editorial-section">
                        <h2>Interview Tips & Guidelines</h2>
                        <div class="tip-card">
                            <h4><i class="fas fa-check-circle"></i> Be Specific</h4>
                            <p>Use concrete examples from your experience. Quantify results when possible.</p>
                        </div>
                        <div class="tip-card">
                            <h4><i class="fas fa-check-circle"></i> Structure Your Answers</h4>
                            <p>Use the STAR method: Situation, Task, Action, Result.</p>
                        </div>
                        <div class="tip-card">
                            <h4><i class="fas fa-check-circle"></i> Show Problem-Solving</h4>
                            <p>Explain your thought process, not just the final answer.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Solutions Tab -->
                <div class="tab-content" id="solutions-content">
                    <div class="solutions-section">
                        <h2>Sample Responses</h2>
                        <p class="text-muted">View example responses after completing your interview.</p>
                    </div>
                </div>
                
                <!-- Submissions Tab -->
                <div class="tab-content" id="submissions-content">
                    <div class="submissions-section">
                        <h2>Your Submissions</h2>
                        <div class="submissions-list" id="submissionsList">
                            <p class="text-muted">No submissions yet. Complete the interview to see your history.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Panel Footer -->
            <div class="panel-footer">
                <div class="footer-stats">
                    <span><i class="fas fa-check-circle"></i> <span id="acceptedCount">0</span> Accepted</span>
                    <span><i class="fas fa-users"></i> <span id="totalUsers">4356</span> Online</span>
                </div>
                <div class="footer-actions">
                    <button class="footer-btn"><i class="fas fa-thumbs-up"></i> <span>335</span></button>
                    <button class="footer-btn"><i class="fas fa-thumbs-down"></i></button>
                    <button class="footer-btn"><i class="fas fa-comment"></i> <span>210</span></button>
                    <button class="footer-btn"><i class="fas fa-star"></i></button>
                    <button class="footer-btn"><i class="fas fa-share-alt"></i></button>
                </div>
            </div>
        </div>
        
        <!-- Resizer -->
        <div class="panel-resizer" id="panelResizer"></div>
        
        <!-- Right Panel - Code Editor -->
        <div class="panel right-panel" id="rightPanel">
            <div class="panel-header">
                <div class="editor-header">
                    <div class="language-selector">
                        <i class="fas fa-code"></i>
                        <select id="languageSelect">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp" selected>C++</option>
                            <option value="csharp">C#</option>
                            <option value="typescript">TypeScript</option>
                        </select>
                    </div>
                    <div class="editor-actions">
                        <button class="editor-btn" title="Auto Format"><i class="fas fa-magic"></i> Auto</button>
                        <button class="editor-btn" title="Reset Code"><i class="fas fa-undo"></i></button>
                        <button class="editor-btn" title="Copy Code"><i class="fas fa-copy"></i></button>
                        <button class="editor-btn" title="Fullscreen"><i class="fas fa-expand"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="panel-content editor-content">
                <!-- Code Editor -->
                <div class="code-editor" id="codeEditor">
                    <div class="line-numbers" id="lineNumbers"></div>
                    <textarea id="codeInput" spellcheck="false" placeholder="// Write your code here..."></textarea>
                </div>
            </div>
            
            <!-- Bottom Section - Test Cases -->
            <div class="test-section" id="testSection">
                <div class="test-header">
                    <div class="test-tabs">
                        <button class="test-tab active" data-test="testcase">
                            <i class="fas fa-flask"></i>
                            <span>Testcase</span>
                        </button>
                        <button class="test-tab" data-test="result">
                            <i class="fas fa-terminal"></i>
                            <span>Test Result</span>
                        </button>
                    </div>
                </div>
                <div class="test-content">
                    <div class="test-panel active" id="testcase-panel">
                        <div class="testcase-input">
                            <label>Input:</label>
                            <textarea id="testInput" placeholder="Enter test input..."></textarea>
                        </div>
                    </div>
                    <div class="test-panel" id="result-panel">
                        <div class="result-output" id="resultOutput">
                            <p class="text-muted">Run your code to see results</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Status Bar -->
            <div class="status-bar">
                <div class="status-left">
                    <span class="status-item">Saved</span>
                    <span class="status-item"><i class="fas fa-cloud"></i> Upgrade to Cloud Saving</span>
                </div>
                <div class="status-right">
                    <span class="status-item">Ln 1, Col 1</span>
                </div>
            </div>
        </div>
    </main>

    <!-- Interview Modal -->
    <div class="modal hidden" id="interviewModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="question-progress">
                    <div class="progress-ring">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45"></circle>
                            <circle cx="50" cy="50" r="45" class="progress-circle"></circle>
                        </svg>
                        <span id="questionNumber">1/15</span>
                    </div>
                    <div class="timer">
                        <i class="fas fa-clock"></i>
                        <span id="timer">00:00</span>
                    </div>
                </div>
                <button class="modal-close" id="closeModal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="question-tags" id="questionTags">
                    <span class="tag">Technical</span>
                </div>
                <h2 class="question-text" id="questionText">Loading question...</h2>
                <textarea id="answerInput" class="answer-textarea" placeholder="Type your answer here..." rows="8"></textarea>
                <div class="ai-warning hidden" id="aiWarning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>AI-generated content detected</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="homeBtn">
                    <i class="fas fa-home"></i> Home
                </button>
                <button class="btn btn-primary" id="nextBtn">
                    Submit & Next <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Results Modal -->
    <div class="modal hidden" id="resultsModal">
        <div class="modal-content results-modal">
            <div class="modal-header">
                <h2>Interview Assessment Results</h2>
                <div class="results-actions">
                    <button class="btn btn-secondary" id="downloadHTML">
                        <i class="fas fa-file-code"></i> HTML
                    </button>
                    <button class="btn btn-primary" id="downloadPDF">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>
            <div class="modal-body results-body">
                <div class="score-card">
                    <div class="score-circle-large">
                        <svg viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="90"></circle>
                            <circle cx="100" cy="100" r="90" class="score-ring"></circle>
                        </svg>
                        <div class="score-text">
                            <span class="score-value" id="overallScore">--</span>
                            <span class="score-label">Overall</span>
                        </div>
                    </div>
                    <div class="recommendation" id="recommendation">
                        <i class="fas fa-hourglass-half"></i>
                        <span>Calculating...</span>
                    </div>
                </div>
                <div class="score-breakdown">
                    <h3>Detailed Scores</h3>
                    <div class="score-item">
                        <div class="score-info">
                            <span>Technical Skills</span>
                            <span class="score-percent" id="technicalScore">--%</span>
                        </div>
                        <div class="score-bar"><div class="score-fill" id="technicalBar"></div></div>
                    </div>
                    <div class="score-item">
                        <div class="score-info">
                            <span>Communication</span>
                            <span class="score-percent" id="communicationScore">--%</span>
                        </div>
                        <div class="score-bar"><div class="score-fill" id="communicationBar"></div></div>
                    </div>
                    <div class="score-item">
                        <div class="score-info">
                            <span>Soft Skills</span>
                            <span class="score-percent" id="softSkillsScore">--%</span>
                        </div>
                        <div class="score-bar"><div class="score-fill" id="softSkillsBar"></div></div>
                    </div>
                </div>
                <div class="insights-section">
                    <div class="insights-column">
                        <h4><i class="fas fa-check-circle text-success"></i> Strengths</h4>
                        <ul id="strengthsList"></ul>
                    </div>
                    <div class="insights-column">
                        <h4><i class="fas fa-exclamation-circle text-danger"></i> Areas to Improve</h4>
                        <ul id="improvementsList"></ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="newInterviewBtn">
                    <i class="fas fa-redo"></i> Start New Interview
                </button>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay hidden" id="loadingOverlay">
        <div class="loading-spinner"></div>
        <p>Processing with AI...</p>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="assets/js/config.js"></script>
    <script src="assets/js/platform-app.js"></script>
</body>
</html>
