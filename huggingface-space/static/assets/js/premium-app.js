// Premium IntervuAI Application

// Scroll to upload section
function scrollToUpload() {
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Upload area functionality
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const resumeInput = document.getElementById('resumeInput');
    
    if (uploadArea && resumeInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
            resumeInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--color-primary)';
            uploadArea.style.background = 'rgba(99, 102, 241, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
        
        // File input change
        resumeInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
});

// Handle file upload
async function handleFileUpload(file) {
    console.log('Uploading file:', file.name);
    
    // Show loading
    showLoading('Analyzing resume with AI...');
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
        // Call Python backend via PHP proxy
        const response = await fetch(getApiUrl('upload_resume'), {
            method: 'POST',
            body: formData,
            headers: {
                'X-User-Session-Id': getSessionId()
            }
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const result = await response.json();
        console.log('Upload result:', result);
        
        hideLoading();
        
        if (result.candidate_profile) {
            // Store profile
            sessionStorage.setItem('candidateProfile', JSON.stringify(result.candidate_profile));
            
            // Show success message
            showAlert('Resume analyzed successfully!', 'success');
            
            // Show interview setup
            setTimeout(() => {
                showInterviewSetup(result.candidate_profile);
            }, 1000);
        } else {
            showAlert('Failed to analyze resume. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        hideLoading();
        showAlert('Failed to upload resume: ' + error.message, 'error');
    }
}

// Show interview setup
function showInterviewSetup(profile) {
    const uploadSection = document.getElementById('uploadSection');
    
    if (uploadSection) uploadSection.classList.add('hidden');
    
    // Create setup UI
    const setupHTML = `
        <div class="glass-card large">
            <div class="card-header">
                <div class="header-icon">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="header-content">
                    <h2 class="card-title">Interview Setup</h2>
                    <p class="card-subtitle">Review candidate profile and configure interview</p>
                </div>
            </div>
            
            <div class="profile-display">
                <div class="profile-item">
                    <span class="profile-label">Name:</span>
                    <span class="profile-value">${profile.name || 'N/A'}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">Email:</span>
                    <span class="profile-value">${profile.email || 'N/A'}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">Experience:</span>
                    <span class="profile-value">${typeof profile.experience === 'object' ? JSON.stringify(profile.experience) : (profile.experience || 'N/A')}</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">Skills:</span>
                    <div class="skills-tags">
                        ${(profile.key_skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="form-group" style="margin-top: 2rem;">
                <label class="form-label">
                    <i class="fas fa-briefcase"></i>
                    <span>Position/Role</span>
                </label>
                <input 
                    type="text" 
                    id="positionInput" 
                    class="form-input" 
                    placeholder="e.g., Senior Software Engineer"
                    value="${profile.inferred_position || ''}"
                >
            </div>
            
            <div class="interview-actions" style="margin-top: 2rem;">
                <button class="btn-secondary" onclick="location.reload()">
                    <i class="fas fa-arrow-left"></i>
                    <span>Back</span>
                </button>
                <button class="btn-primary" onclick="startInterview()">
                    <span>Start Interview</span>
                    <i class="fas fa-arrow-right"></i>
                    <div class="btn-glow"></div>
                </button>
            </div>
        </div>
    `;
    
    const container = document.createElement('section');
    container.className = 'upload-section';
    container.id = 'setupSection';
    container.innerHTML = setupHTML;
    
    uploadSection.parentNode.insertBefore(container, uploadSection);
}

// Start interview
async function startInterview() {
    const position = document.getElementById('positionInput')?.value;
    
    if (!position) {
        showAlert('Please enter a position/role', 'error');
        return;
    }
    
    // Show pre-exam checklist
    showPreExamChecklist(position);
}

// Show pre-exam checklist and requirements
async function showPreExamChecklist(position) {
    const overlay = document.createElement('div');
    overlay.className = 'critical-warning-overlay show';
    overlay.id = 'preExamChecklist';
    overlay.style.zIndex = '99999';
    overlay.innerHTML = `
        <div class="critical-warning-box" style="max-width: 600px;">
            <div class="warning-icon" style="background: rgba(99, 102, 241, 0.2);">
                <i class="fas fa-clipboard-check" style="color: var(--color-primary);"></i>
            </div>
            <h3>Pre-Interview Checklist</h3>
            <p style="margin-bottom: 1.5rem;">Please ensure all requirements are met before starting:</p>
            
            <div class="checklist-items">
                <div class="checklist-item" id="check-browser">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Checking browser compatibility...</span>
                </div>
                <div class="checklist-item" id="check-extensions">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Checking for blocked extensions...</span>
                </div>
                <div class="checklist-item" id="check-camera">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Requesting camera access...</span>
                </div>
                <div class="checklist-item" id="check-microphone">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Requesting microphone access...</span>
                </div>
                <div class="checklist-item" id="check-questions">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Generating interview questions...</span>
                </div>
            </div>
            
            <div id="checklistActions" style="margin-top: 2rem; display: none;">
                <button class="btn-primary" onclick="beginInterview()" style="width: 100%;">
                    <i class="fas fa-play"></i>
                    <span>Start Interview</span>
                    <div class="btn-glow"></div>
                </button>
            </div>
            
            <div id="checklistError" style="margin-top: 2rem; display: none; display: flex; gap: 1rem;">
                <button class="btn-secondary" onclick="recheckRequirements()" style="flex: 1;">
                    <i class="fas fa-redo"></i>
                    <span>Recheck</span>
                </button>
                <button class="btn-secondary" onclick="document.getElementById('preExamChecklist').remove()" style="flex: 1;">
                    <i class="fas fa-times"></i>
                    <span>Cancel</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Add checklist styles
    const style = document.createElement('style');
    style.textContent = `
        .checklist-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 1rem 0;
        }
        .checklist-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--color-surface);
            border-radius: var(--radius-md);
            border-left: 3px solid var(--color-text-tertiary);
        }
        .checklist-item.success {
            border-left-color: var(--color-success);
        }
        .checklist-item.error {
            border-left-color: var(--color-danger);
        }
        .checklist-item i {
            font-size: 20px;
            min-width: 20px;
        }
        .checklist-item.success i {
            color: var(--color-success);
        }
        .checklist-item.error i {
            color: var(--color-danger);
        }
    `;
    document.head.appendChild(style);
    
    // Run checks
    await runPreExamChecks(position);
}

// Recheck all requirements
async function recheckRequirements() {
    // Hide action buttons
    document.getElementById('checklistActions').style.display = 'none';
    document.getElementById('checklistError').style.display = 'none';
    
    // Reset all checklist items to loading state
    const items = ['check-browser', 'check-extensions', 'check-camera', 'check-microphone', 'check-questions'];
    items.forEach(itemId => {
        const item = document.getElementById(itemId);
        if (item) {
            item.className = 'checklist-item';
            item.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Checking...</span>
            `;
        }
    });
    
    // Get position from session or input
    const position = document.getElementById('positionInput')?.value || 'Software Engineer';
    
    // Re-run all checks
    await runPreExamChecks(position);
}

// Run all pre-exam checks
async function runPreExamChecks(position) {
    let allPassed = true;
    
    // 1. Check browser
    await checkItem('check-browser', async () => {
        const isCompatible = window.examSecurity.checkBrowser();
        if (!isCompatible) {
            throw new Error('Unsupported browser. Please use Chrome, Edge, Brave, or Opera.');
        }
        return 'Browser compatible';
    });
    
    // 2. Check extensions
    const extensionsOk = await checkItem('check-extensions', async () => {
        const hasBlocked = await window.examSecurity.detectExtensions();
        if (hasBlocked) {
            throw new Error('AI extensions detected. Please disable them and refresh.');
        }
        return 'No blocked extensions found';
    });
    
    if (!extensionsOk) allPassed = false;
    
    // 3. Check camera
    const cameraOk = await checkItem('check-camera', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return 'Camera access granted';
        } catch (error) {
            throw new Error('Camera access denied. Please allow camera access.');
        }
    });
    
    if (!cameraOk) allPassed = false;
    
    // 4. Check microphone
    const micOk = await checkItem('check-microphone', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return 'Microphone access granted';
        } catch (error) {
            throw new Error('Microphone access denied. Please allow microphone access.');
        }
    });
    
    if (!micOk) allPassed = false;
    
    // 5. Generate questions
    const questionsOk = await checkItem('check-questions', async () => {
        const response = await fetch(getApiUrl('setup_interview'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Session-Id': getSessionId()
            },
            body: JSON.stringify({ position_role: position })
        });
        
        const result = await response.json();
        
        if (!result.questions) {
            throw new Error('Failed to generate questions');
        }
        
        sessionStorage.setItem('questions', JSON.stringify(result.questions));
        sessionStorage.setItem('currentQuestion', '0');
        sessionStorage.setItem('responses', JSON.stringify([]));
        sessionStorage.setItem('isCodingRole', result.is_coding_role || false);
        
        return `${result.questions.length} questions generated`;
    });
    
    if (!questionsOk) allPassed = false;
    
    // Show appropriate action
    if (allPassed) {
        document.getElementById('checklistActions').style.display = 'block';
    } else {
        document.getElementById('checklistError').style.display = 'block';
    }
}

// Check individual item
async function checkItem(itemId, checkFunction) {
    const item = document.getElementById(itemId);
    if (!item) return false;
    
    try {
        const message = await checkFunction();
        item.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        item.classList.add('success');
        return true;
    } catch (error) {
        item.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>${error.message}</span>
        `;
        item.classList.add('error');
        return false;
    }
}

// Begin interview after all checks pass
async function beginInterview() {
    // Remove checklist
    document.getElementById('preExamChecklist')?.remove();
    
    showLoading('Initializing secure exam environment...');
    
    try {
        // Start exam security mode
        const securityStarted = await window.examSecurity.startExamMode();
        if (!securityStarted) {
            hideLoading();
            return;
        }
        
        // Start proctoring (camera + audio monitoring)
        const proctoringStarted = await window.proctoringSystem.startProctoring();
        if (!proctoringStarted) {
            hideLoading();
            return;
        }
        
        // Activate exam mode
        window.examSecurity.activateExamMode();
        
        hideLoading();
        
        // Hide all UI elements except interview section
        hideAllUIForExam();
        
        // Hide setup, show interview
        document.getElementById('setupSection')?.classList.add('hidden');
        document.getElementById('interviewSection')?.classList.remove('hidden');
        
        loadQuestion(0);
        
    } catch (error) {
        hideLoading();
        showAlert('Error starting interview: ' + error.message, 'error');
    }
}

// Load question
function loadQuestion(index) {
    const questions = JSON.parse(sessionStorage.getItem('questions') || '[]');
    const question = questions[index];
    const isCodingRole = sessionStorage.getItem('isCodingRole') === 'true';
    
    if (!question) return;
    
    // Clear previous answer
    const answerTextarea = document.getElementById('answerText');
    if (answerTextarea) {
        answerTextarea.value = '';
    }
    
    // Check if this is a coding question
    const isCodingQuestion = question.tags && (
        question.tags.includes('coding') || 
        question.tags.includes('programming') ||
        question.id.includes('code')
    );
    
    // Show/hide coding editor based on question type
    const answerContainer = document.querySelector('.answer-container');
    if (answerContainer) {
        if (isCodingRole && isCodingQuestion) {
            // Show coding editor with language selector
            answerContainer.innerHTML = `
                <div class="coding-challenge-notice">
                    <i class="fas fa-code"></i>
                    <span>Coding Challenge - Write your solution below</span>
                </div>
                <div class="coding-language-selector">
                    <label for="languageSelect">
                        <i class="fas fa-laptop-code"></i>
                        <span>Select Language:</span>
                    </label>
                    <select id="languageSelect" class="language-dropdown" onchange="changeLanguage(this.value)">
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="typescript">TypeScript</option>
                        <option value="kotlin">Kotlin</option>
                        <option value="swift">Swift</option>
                    </select>
                </div>
                <iframe 
                    id="codingEditor" 
                    src="https://onecompiler.com/embed/python?hideNew=true&hideNewFileOption=true&hideLanguageSelection=true&theme=dark&hideStdin=true&hideResult=false&fontSize=16"
                    style="width: 100%; height: 100%; min-height: 700px; border: 1px solid var(--glass-border); border-radius: var(--radius-lg); margin-top: 1rem;"
                    frameborder="0"
                ></iframe>
                <div class="code-submission-notice" style="margin-top: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);">
                    <i class="fas fa-exclamation-triangle" style="color: var(--color-danger);"></i>
                    <strong style="color: var(--color-danger);">Important:</strong> Copy your final working code from the editor above and paste it in the box below for evaluation.
                </div>
                <textarea 
                    id="codeSubmission" 
                    class="answer-input" 
                    placeholder="Paste your final code here for evaluation..."
                    rows="6"
                    style="margin-top: 1rem; font-family: 'Courier New', monospace; font-size: 14px;"
                ></textarea>
                <textarea 
                    id="answerText" 
                    class="answer-input" 
                    placeholder="Explain your approach and solution here..."
                    rows="4"
                    style="margin-top: 1rem;"
                ></textarea>
            `;
        } else {
            // Show regular textarea
            answerContainer.innerHTML = `
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
            `;
        }
    }
    
    document.getElementById('questionText').textContent = question.question;
    
    // Add coding-mode class to interview section if it's a coding question
    const interviewSection = document.getElementById('interviewSection');
    if (interviewSection) {
        if (isCodingRole && isCodingQuestion) {
            interviewSection.classList.add('coding-mode');
        } else {
            interviewSection.classList.remove('coding-mode');
        }
    }
    
    // Update progress
    const progressNumber = document.querySelector('.progress-number');
    if (progressNumber) {
        progressNumber.textContent = `${index + 1}/${questions.length}`;
    }
    
    // Update progress ring
    const progress = ((index + 1) / questions.length) * 100;
    const progressRing = document.querySelector('.progress-ring');
    if (progressRing) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (progress / 100) * circumference;
        progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        progressRing.style.strokeDashoffset = offset;
    }
    
    // Hide previous button (can't go back)
    const prevButton = document.querySelector('[onclick="previousQuestion()"]');
    if (prevButton) {
        prevButton.style.display = 'none';
    }
    
    // Start question timer with auto-submit
    // Give more time for coding questions (20 minutes vs 3 minutes)
    if (isCodingRole && isCodingQuestion) {
        window.examSecurity.startQuestionTimer(() => {
            autoSubmitAndNext();
        }, 1200); // 20 minutes for coding questions
    } else {
        window.examSecurity.startQuestionTimer(() => {
            autoSubmitAndNext();
        }, 180); // 3 minutes for regular questions
    }
}

// Submit answer and move to next question
async function submitAnswer() {
    const currentIndex = parseInt(sessionStorage.getItem('currentQuestion') || '0');
    const questions = JSON.parse(sessionStorage.getItem('questions') || '[]');
    const question = questions[currentIndex];
    
    // Check if this is a coding question
    const isCodingQuestion = question.tags && (
        question.tags.includes('coding') || 
        question.tags.includes('programming')
    );
    
    const answerTextarea = document.getElementById('answerText');
    const answer = answerTextarea?.value.trim();
    
    // For coding questions, require code submission
    let codeSubmission = '';
    if (isCodingQuestion) {
        const codeTextarea = document.getElementById('codeSubmission');
        codeSubmission = codeTextarea?.value.trim() || '';
        
        if (!codeSubmission) {
            showAlert('Please paste your code in the code submission box', 'error');
            return;
        }
    }
    
    if (!answer && !isCodingQuestion) {
        showAlert('Please provide an answer before continuing', 'error');
        return;
    }
    
    showLoading('Evaluating your answer...');
    
    try {
        const response = await fetch(getApiUrl('submit_answer'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Session-Id': getSessionId()
            },
            body: JSON.stringify({
                question_id: question.id || `q${currentIndex + 1}`,
                response_text: answer,
                code_submission: codeSubmission,
                is_coding_question: isCodingQuestion,
                duration: window.examSecurity.getQuestionDuration()
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit answer');
        }
        
        const result = await response.json();
        hideLoading();
        
        // Store response
        const responses = JSON.parse(sessionStorage.getItem('responses') || '[]');
        responses.push({
            question: question.question,
            answer: answer,
            evaluation: result.evaluation,
            time_taken: window.examSecurity.getQuestionDuration()
        });
        sessionStorage.setItem('responses', JSON.stringify(responses));
        
        // Stop timer
        window.examSecurity.stopQuestionTimer();
        
        // Move to next question
        if (currentIndex < questions.length - 1) {
            sessionStorage.setItem('currentQuestion', (currentIndex + 1).toString());
            loadQuestion(currentIndex + 1);
        } else {
            // Interview complete
            completeInterview();
        }
        
    } catch (error) {
        hideLoading();
        console.error('Submit answer error:', error);
        showAlert('Error submitting answer: ' + error.message, 'error');
        
        // Still move to next question to avoid getting stuck
        const currentIndex = parseInt(sessionStorage.getItem('currentQuestion') || '0');
        const questions = JSON.parse(sessionStorage.getItem('questions') || '[]');
        if (currentIndex < questions.length - 1) {
            setTimeout(() => {
                sessionStorage.setItem('currentQuestion', (currentIndex + 1).toString());
                loadQuestion(currentIndex + 1);
            }, 2000);
        }
    }
}

// Auto-submit when time runs out
async function autoSubmitAndNext() {
    const answerTextarea = document.getElementById('answerText');
    const answer = answerTextarea?.value.trim() || '[No answer provided - Time expired]';
    
    const currentIndex = parseInt(sessionStorage.getItem('currentQuestion') || '0');
    const questions = JSON.parse(sessionStorage.getItem('questions') || '[]');
    const question = questions[currentIndex];
    
    try {
        const response = await fetch(getApiUrl('submit_answer'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Session-Id': getSessionId()
            },
            body: JSON.stringify({
                question_id: question.id || `q${currentIndex + 1}`,
                response_text: answer,
                duration: '03:00',
                auto_submitted: true
            })
        });
        
        const result = await response.json();
        
        // Store response
        const responses = JSON.parse(sessionStorage.getItem('responses') || '[]');
        responses.push({
            question: question.question,
            answer: answer,
            evaluation: result.evaluation,
            time_taken: '03:00',
            auto_submitted: true
        });
        sessionStorage.setItem('responses', JSON.stringify(responses));
        
        // Move to next question
        if (currentIndex < questions.length - 1) {
            sessionStorage.setItem('currentQuestion', (currentIndex + 1).toString());
            loadQuestion(currentIndex + 1);
        } else {
            // Interview complete
            completeInterview();
        }
        
    } catch (error) {
        console.error('Auto-submit error:', error);
        // Still move to next question even if submit fails
        if (currentIndex < questions.length - 1) {
            sessionStorage.setItem('currentQuestion', (currentIndex + 1).toString());
            loadQuestion(currentIndex + 1);
        } else {
            completeInterview();
        }
    }
}

// Previous question (disabled - can't go back)
function previousQuestion() {
    showAlert('You cannot go back to previous questions', 'error');
}

// Change coding language
function changeLanguage(language) {
    const iframe = document.getElementById('codingEditor');
    if (iframe) {
        iframe.src = `https://onecompiler.com/embed/${language}?hideNew=true&hideNewFileOption=true&hideLanguageSelection=true&theme=dark&hideStdin=true&hideResult=false&fontSize=16`;
    }
}

// Hide all UI elements during exam
function hideAllUIForExam() {
    // Hide navigation
    const nav = document.querySelector('.premium-nav');
    if (nav) nav.style.display = 'none';
    
    // Hide hero section
    const hero = document.querySelector('.hero-section');
    if (hero) hero.style.display = 'none';
    
    // Hide background animations (dim them)
    const bg = document.querySelector('.premium-bg');
    if (bg) bg.style.opacity = '0.3';
    
    // Add exam mode class to body
    document.body.classList.add('exam-mode');
}

// Show all UI elements after exam
function showAllUIAfterExam() {
    // Show navigation
    const nav = document.querySelector('.premium-nav');
    if (nav) nav.style.display = 'block';
    
    // Show hero section
    const hero = document.querySelector('.hero-section');
    if (hero) hero.style.display = 'flex';
    
    // Show background animations
    const bg = document.querySelector('.premium-bg');
    if (bg) bg.style.opacity = '1';
    
    // Remove exam mode class from body
    document.body.classList.remove('exam-mode');
}

// Complete interview
async function completeInterview() {
    showLoading('Generating your assessment report...');
    
    // End exam mode
    window.examSecurity.endExamMode();
    
    // Stop proctoring
    window.proctoringSystem.stopProctoring();
    
    // Restore UI elements
    showAllUIAfterExam();
    
    try {
        const response = await fetch(getApiUrl('get_assessment'), {
            method: 'GET',
            headers: {
                'X-User-Session-Id': getSessionId()
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate assessment');
        }
        
        const result = await response.json();
        hideLoading();
        
        if (result.assessment) {
            sessionStorage.setItem('assessment', JSON.stringify(result.assessment));
            showResults();
        } else {
            showAlert('Failed to generate assessment', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Assessment error:', error);
        showAlert('Error generating assessment: ' + error.message, 'error');
        
        // Show results anyway with partial data
        setTimeout(() => {
            showResults();
        }, 2000);
    }
}

// Hide all UI elements during exam
function hideAllUIForExam() {
    // Hide navigation
    const nav = document.querySelector('.premium-nav');
    if (nav) nav.style.display = 'none';
    
    // Hide hero section
    const hero = document.querySelector('.hero-section');
    if (hero) hero.style.display = 'none';
    
    // Hide background animations
    const bg = document.querySelector('.premium-bg');
    if (bg) bg.style.opacity = '0.3';
    
    // Add exam mode class to body
    document.body.classList.add('exam-mode');
}

// Show all UI elements after exam
function showAllUIAfterExam() {
    // Show navigation
    const nav = document.querySelector('.premium-nav');
    if (nav) nav.style.display = 'block';
    
    // Show hero section
    const hero = document.querySelector('.hero-section');
    if (hero) hero.style.display = 'flex';
    
    // Show background animations
    const bg = document.querySelector('.premium-bg');
    if (bg) bg.style.opacity = '1';
    
    // Remove exam mode class from body
    document.body.classList.remove('exam-mode');
}

// Show results
function showResults() {
    // Check if we're on the results page or main page
    const isResultsPage = window.location.pathname.includes('results.php');
    
    if (!isResultsPage) {
        // Redirect to results page
        window.location.href = 'results.php';
        return;
    }
    
    document.getElementById('interviewSection')?.classList.add('hidden');
    document.getElementById('resultsSection')?.classList.remove('hidden');
    
    // Display assessment
    const assessment = JSON.parse(sessionStorage.getItem('assessment') || '{}');
    const responses = JSON.parse(sessionStorage.getItem('responses') || '[]');
    
    console.log('Assessment:', assessment);
    console.log('Responses:', responses);
    
    // Check if we have assessment data
    if (!assessment || typeof assessment.overallScore === 'undefined') {
        showAlert('No assessment data available', 'error');
        return;
    }
    
    // Update overall score (handle 0 as valid score)
    const overallScoreEl = document.getElementById('overallScore');
    if (overallScoreEl) {
        overallScoreEl.textContent = assessment.overallScore;
    }
    
    // Update recommendation
    const recommendationEl = document.getElementById('recommendation');
    if (recommendationEl && assessment.recommendation) {
        const rec = assessment.recommendation;
        let icon = 'fa-check-circle';
        let color = 'var(--color-success)';
        
        if (rec.toLowerCase().includes('not recommended')) {
            icon = 'fa-times-circle';
            color = 'var(--color-danger)';
        } else if (rec.toLowerCase().includes('consider')) {
            icon = 'fa-exclamation-circle';
            color = 'var(--color-warning)';
        }
        
        recommendationEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${rec}</span>
        `;
        recommendationEl.style.borderColor = color;
        recommendationEl.style.color = color;
        recommendationEl.style.background = color + '20';
    }
    
    // Update detailed scores
    if (assessment.detailedScores) {
        const scores = assessment.detailedScores;
        const scoreItems = document.querySelectorAll('.score-item');
        
        if (scoreItems.length >= 3) {
            // Technical Skills
            const techScore = scores.technicalSkills ?? 0;
            scoreItems[0].querySelector('.score-percent').textContent = techScore + '%';
            scoreItems[0].querySelector('.score-bar-fill').style.width = techScore + '%';
            
            // Communication
            const commScore = scores.communication ?? 0;
            scoreItems[1].querySelector('.score-percent').textContent = commScore + '%';
            scoreItems[1].querySelector('.score-bar-fill').style.width = commScore + '%';
            
            // Soft Skills
            const softScore = scores.softSkills ?? 0;
            scoreItems[2].querySelector('.score-percent').textContent = softScore + '%';
            scoreItems[2].querySelector('.score-bar-fill').style.width = softScore + '%';
        }
    }
    
    // Update progress ring
    const scoreRing = document.querySelector('.results-section .score-ring');
    if (scoreRing) {
        const score = assessment.overallScore ?? 0;
        const circumference = 2 * Math.PI * 90;
        const progress = (score / 100) * circumference;
        scoreRing.style.strokeDasharray = `${circumference} ${circumference}`;
        scoreRing.style.strokeDashoffset = circumference - progress;
    }
    
    // Update strengths list
    const strengthsList = document.getElementById('strengthsList');
    if (strengthsList && assessment.keyStrengths && assessment.keyStrengths.length > 0) {
        strengthsList.innerHTML = assessment.keyStrengths.map(strength => 
            `<li style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--color-success); margin: 0.5rem 0; border-radius: 4px;">
                <i class="fas fa-check-circle" style="color: var(--color-success); margin-right: 0.5rem;"></i>
                ${strength}
            </li>`
        ).join('');
    }
    
    // Update improvements list
    const improvementsList = document.getElementById('improvementsList');
    if (improvementsList && assessment.areasForImprovement && assessment.areasForImprovement.length > 0) {
        improvementsList.innerHTML = assessment.areasForImprovement.map(area => 
            `<li style="padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--color-danger); margin: 0.5rem 0; border-radius: 4px;">
                <i class="fas fa-exclamation-circle" style="color: var(--color-danger); margin-right: 0.5rem;"></i>
                ${area}
            </li>`
        ).join('');
    }
}

// Generate HTML content for report
function generateReportHTML() {
    const assessment = JSON.parse(sessionStorage.getItem('assessment') || '{}');
    const profile = JSON.parse(sessionStorage.getItem('candidateProfile') || '{}');
    const responses = JSON.parse(sessionStorage.getItem('responses') || '[]');
    
    // Check if assessment exists (allow 0 as valid score)
    if (!assessment || typeof assessment.overallScore === 'undefined') {
        return null;
    }
    
    // Create HTML content
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Interview Assessment Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
                .header h1 { color: #6366f1; margin: 0; }
                .header p { color: #666; margin: 5px 0; }
                .section { margin: 30px 0; }
                .section h2 { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                .profile-item { padding: 10px; background: #f9fafb; border-radius: 5px; }
                .profile-item strong { color: #6366f1; }
                .score-box { text-align: center; padding: 30px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 10px; margin: 20px 0; }
                .score-box .score { font-size: 72px; font-weight: bold; }
                .score-box .label { font-size: 18px; opacity: 0.9; }
                .scores-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
                .score-card { padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center; }
                .score-card .value { font-size: 36px; font-weight: bold; color: #6366f1; }
                .score-card .name { color: #666; margin-top: 10px; }
                .recommendation { padding: 20px; background: #10b981; color: white; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
                .recommendation.not-recommended { background: #ef4444; }
                .recommendation.consider { background: #f59e0b; }
                .list-section ul { list-style: none; padding: 0; }
                .list-section li { padding: 10px; margin: 5px 0; background: #f9fafb; border-left: 4px solid #6366f1; }
                .question-analysis { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
                .question-analysis h4 { color: #6366f1; margin: 0 0 10px 0; }
                .question-analysis .answer { color: #666; font-style: italic; margin: 10px 0; }
                .question-analysis .scores { display: flex; gap: 15px; margin-top: 10px; }
                .question-analysis .scores span { padding: 5px 10px; background: white; border-radius: 5px; font-size: 14px; }
                .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🧠 IntervuAI Pro</h1>
                <p>AI-Powered Interview Assessment Report</p>
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div class="section">
                <h2>Candidate Profile</h2>
                <div class="profile-grid">
                    <div class="profile-item"><strong>Name:</strong> ${profile.name || 'N/A'}</div>
                    <div class="profile-item"><strong>Email:</strong> ${profile.email || 'N/A'}</div>
                    <div class="profile-item"><strong>Position:</strong> ${profile.position || profile.inferred_position || 'N/A'}</div>
                    <div class="profile-item"><strong>Experience:</strong> ${profile.experience || 'N/A'}</div>
                </div>
                <div class="profile-item" style="grid-column: 1 / -1;">
                    <strong>Skills:</strong> ${(profile.key_skills || []).join(', ') || 'N/A'}
                </div>
            </div>
            
            <div class="score-box">
                <div class="score">${assessment.overallScore || 0}</div>
                <div class="label">Overall Score</div>
            </div>
            
            <div class="recommendation ${getRecommendationClass(assessment.recommendation)}">
                ${assessment.recommendation || 'No Recommendation'}
            </div>
            
            <div class="section">
                <h2>Detailed Scores</h2>
                <div class="scores-grid">
                    <div class="score-card">
                        <div class="value">${assessment.detailedScores?.technicalSkills || 0}%</div>
                        <div class="name">Technical Skills</div>
                    </div>
                    <div class="score-card">
                        <div class="value">${assessment.detailedScores?.communication || 0}%</div>
                        <div class="name">Communication</div>
                    </div>
                    <div class="score-card">
                        <div class="value">${assessment.detailedScores?.softSkills || 0}%</div>
                        <div class="name">Soft Skills</div>
                    </div>
                </div>
            </div>
            
            <div class="section list-section">
                <h2>Key Strengths</h2>
                <ul>
                    ${(assessment.keyStrengths || ['No strengths identified']).map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <div class="section list-section">
                <h2>Areas for Improvement</h2>
                <ul>
                    ${(assessment.areasForImprovement || ['No areas identified']).map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
            
            <div class="section">
                <h2>Question-by-Question Analysis</h2>
                ${responses.map((r, i) => `
                    <div class="question-analysis">
                        <h4>Question ${i + 1}: ${r.question}</h4>
                        <div class="answer"><strong>Answer:</strong> ${r.answer.substring(0, 200)}${r.answer.length > 200 ? '...' : ''}</div>
                        <div class="scores">
                            <span>Technical: ${r.evaluation?.technicalScore || 0}%</span>
                            <span>Communication: ${r.evaluation?.communicationScore || 0}%</span>
                            <span>Relevance: ${r.evaluation?.relevanceScore || 0}%</span>
                            <span>Overall: ${r.evaluation?.score || 0}%</span>
                        </div>
                        <p><strong>Feedback:</strong> ${r.evaluation?.feedback || 'No feedback'}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="footer">
                <p>This report was generated by IntervuAI Pro - AI-Powered Interview Platform</p>
                <p>Interview Duration: ${assessment.interviewDuration || 'N/A'}</p>
            </div>
        </body>
        </html>
    `;
    
    return { htmlContent, profile, assessment };
}

// Download report as HTML
function downloadReportHTML() {
    const reportData = generateReportHTML();
    
    if (!reportData) {
        showAlert('No assessment data available. Please complete the interview first.', 'error');
        return;
    }
    
    const { htmlContent, profile } = reportData;
    
    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Assessment_${profile.name || 'Candidate'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('HTML report downloaded successfully!', 'success');
}

// Download report as PDF
async function downloadReportPDF() {
    const reportData = generateReportHTML();
    
    if (!reportData) {
        showAlert('No assessment data available. Please complete the interview first.', 'error');
        return;
    }
    
    const { htmlContent, profile, assessment } = reportData;
    
    showLoading('Generating PDF report...');
    
    try {
        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '800px';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
        
        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use html2canvas to capture the content
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Remove temporary container
        document.body.removeChild(container);
        
        // Create PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        const imgData = canvas.toDataURL('image/png');
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Save PDF
        pdf.save(`Interview_Assessment_${profile.name || 'Candidate'}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        hideLoading();
        showAlert('PDF report downloaded successfully!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('PDF generation error:', error);
        showAlert('Failed to generate PDF. Try downloading HTML instead.', 'error');
    }
}

function getRecommendationClass(recommendation) {
    if (!recommendation) return '';
    const rec = recommendation.toLowerCase();
    if (rec.includes('not recommended')) return 'not-recommended';
    if (rec.includes('consider')) return 'consider';
    return '';
}

// Utility functions
function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('.loading-text').textContent = message;
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert-toast alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    
    // Animate in
    setTimeout(() => alert.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Add toast styles
const style = document.createElement('style');
style.textContent = `
.alert-toast {
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 16px 24px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    box-shadow: var(--glass-shadow);
}

.alert-toast.show {
    transform: translateX(0);
}

.alert-toast.alert-success {
    border-color: var(--color-success);
    color: var(--color-success);
}

.alert-toast.alert-error {
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.alert-toast.alert-info {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.profile-display {
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--glass-border);
}

.profile-item {
    display: flex;
    gap: 1rem;
    align-items: start;
}

.profile-label {
    font-weight: 600;
    color: var(--color-text-secondary);
    min-width: 120px;
}

.profile-value {
    color: var(--color-text-primary);
}

.skills-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.skill-tag {
    padding: 4px 12px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 20px;
    font-size: 14px;
    color: var(--color-primary);
}

.form-input {
    width: 100%;
    padding: 14px 16px;
    background: var(--color-surface);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 16px;
    transition: all var(--transition-base);
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.form-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--color-text-secondary);
}
`;
document.head.appendChild(style);


// Reset interview and go back to home
function resetInterview() {
    // During exam mode, show warning about termination
    if (document.body.classList.contains('exam-mode')) {
        if (confirm('⚠️ WARNING: Exiting will terminate your interview!\n\nYour progress will be lost and the interview will be marked as incomplete.\n\nAre you sure you want to exit?')) {
            // End exam mode
            window.examSecurity.endExamMode();
            
            // Log termination
            window.examSecurity.logSecurityEvent('exam_abandoned', {
                reason: 'user_exit',
                timestamp: new Date().toISOString()
            });
            
            sessionStorage.clear();
            location.reload();
        }
    } else {
        if (confirm('Are you sure you want to go back to home? All progress will be lost.')) {
            sessionStorage.clear();
            location.reload();
        }
    }
}

// Update next button to submit answer
document.addEventListener('DOMContentLoaded', () => {
    // Replace next button click handler
    const nextButton = document.querySelector('[onclick="nextQuestion()"]');
    if (nextButton) {
        nextButton.setAttribute('onclick', 'submitAnswer()');
        const buttonText = nextButton.querySelector('span');
        if (buttonText) {
            buttonText.textContent = 'Submit & Next';
        }
    }
});
