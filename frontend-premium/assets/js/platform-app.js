// IntervuAI Pro - Platform Application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initTabs();
    initUpload();
    initCodeEditor();
    initPanelResizer();
    initTestTabs();
    initModals();
}

// ============================================
// TAB NAVIGATION
// ============================================

function initTabs() {
    const tabs = document.querySelectorAll('.panel-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}

// ============================================
// FILE UPLOAD
// ============================================

function initUpload() {
    const uploadBox = document.getElementById('uploadBox');
    const resumeInput = document.getElementById('resumeInput');
    const uploadProgress = document.getElementById('uploadProgress');
    
    if (!uploadBox || !resumeInput) return;
    
    uploadBox.addEventListener('click', () => resumeInput.click());
    
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--accent-primary)';
        uploadBox.style.background = 'rgba(255, 161, 22, 0.1)';
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = '';
        uploadBox.style.background = '';
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '';
        uploadBox.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    resumeInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    const validTypes = ['application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file.');
        return;
    }
    
    const uploadBox = document.getElementById('uploadBox');
    const uploadProgress = document.getElementById('uploadProgress');
    
    uploadBox.classList.add('hidden');
    uploadProgress.classList.remove('hidden');
    
    await simulateProgress();
    showInterviewModal();
}

function simulateProgress() {
    return new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
}

// ============================================
// CODE EDITOR
// ============================================

function initCodeEditor() {
    const codeInput = document.getElementById('codeInput');
    const lineNumbers = document.getElementById('lineNumbers');
    
    if (!codeInput || !lineNumbers) return;
    
    const defaultCode = `class Solution {
public:
    vector<int> countMentions(int numberOfUsers, vector<vector<string>>& events) {
        
    }
};`;
    
    codeInput.value = defaultCode;
    updateLineNumbers();
    
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });
    
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 4;
            updateLineNumbers();
        }
    });
    
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n').length;
        let numbersHtml = '';
        for (let i = 1; i <= lines; i++) {
            numbersHtml += i + '\n';
        }
        lineNumbers.textContent = numbersHtml;
    }
    
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            const templates = {
                javascript: `/**
 * @param {number} numberOfUsers
 * @param {string[][]} events
 * @return {number[]}
 */
var countMentions = function(numberOfUsers, events) {
    
};`,
                python: `class Solution:
    def countMentions(self, numberOfUsers: int, events: List[List[str]]) -> List[int]:
        pass`,
                java: `class Solution {
    public int[] countMentions(int numberOfUsers, List<List<String>> events) {
        
    }
}`,
                cpp: `class Solution {
public:
    vector<int> countMentions(int numberOfUsers, vector<vector<string>>& events) {
        
    }
};`,
                csharp: `public class Solution {
    public int[] CountMentions(int numberOfUsers, IList<IList<string>> events) {
        
    }
}`,
                typescript: `function countMentions(numberOfUsers: number, events: string[][]): number[] {
    
};`
            };
            
            codeInput.value = templates[e.target.value] || '';
            updateLineNumbers();
        });
    }
}

// ============================================
// PANEL RESIZER
// ============================================

function initPanelResizer() {
    const resizer = document.getElementById('panelResizer');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    
    if (!resizer || !leftPanel || !rightPanel) return;
    
    let isResizing = false;
    
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const containerWidth = leftPanel.parentElement.offsetWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        
        if (newLeftWidth > 20 && newLeftWidth < 80) {
            leftPanel.style.width = newLeftWidth + '%';
        }
    });
    
    document.addEventListener('mouseup', () => {
        isResizing = false;
        resizer.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// ============================================
// TEST TABS
// ============================================

function initTestTabs() {
    const testTabs = document.querySelectorAll('.test-tab');
    
    testTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const testId = tab.dataset.test;
            
            testTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.test-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(`${testId}-panel`).classList.add('active');
        });
    });
    
    const runBtn = document.getElementById('runBtn');
    if (runBtn) {
        runBtn.addEventListener('click', runCode);
    }
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitCode);
    }
}

function runCode() {
    const resultOutput = document.getElementById('resultOutput');
    const resultTab = document.querySelector('[data-test="result"]');
    
    document.querySelectorAll('.test-tab').forEach(t => t.classList.remove('active'));
    resultTab.classList.add('active');
    
    document.querySelectorAll('.test-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('result-panel').classList.add('active');
    
    resultOutput.innerHTML = '<p style="color: var(--accent-green);">Running...</p>';
    
    setTimeout(() => {
        resultOutput.innerHTML = `
            <div style="color: var(--accent-green); margin-bottom: 8px;">
                <i class="fas fa-check-circle"></i> Accepted
            </div>
            <div style="color: var(--text-muted); font-size: 12px;">
                Runtime: 0 ms | Memory: 8.2 MB
            </div>
        `;
    }, 1000);
}

function submitCode() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        alert('Code submitted successfully!');
    }, 2000);
}

// ============================================
// MODALS
// ============================================

function initModals() {
    const closeModal = document.getElementById('closeModal');
    const homeBtn = document.getElementById('homeBtn');
    const nextBtn = document.getElementById('nextBtn');
    const newInterviewBtn = document.getElementById('newInterviewBtn');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('interviewModal').classList.add('hidden');
        });
    }
    
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            document.getElementById('interviewModal').classList.add('hidden');
            resetUpload();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', submitAnswer);
    }
    
    if (newInterviewBtn) {
        newInterviewBtn.addEventListener('click', () => {
            document.getElementById('resultsModal').classList.add('hidden');
            resetUpload();
        });
    }
}

// Interview state
let currentQuestion = 0;
let totalQuestions = 15;
let answers = [];
let timerInterval;
let elapsedTime = 0;

const sampleQuestions = [
    { text: "Tell me about yourself and your professional background.", tags: ["Behavioral", "Introduction"] },
    { text: "Describe a challenging project you worked on. What was your role?", tags: ["Behavioral", "Experience"] },
    { text: "How do you handle tight deadlines and pressure?", tags: ["Soft Skills", "Time Management"] },
    { text: "Explain a technical concept you're passionate about.", tags: ["Technical", "Communication"] },
    { text: "What's your approach to debugging complex issues?", tags: ["Technical", "Problem Solving"] },
    { text: "Describe a time when you had to learn a new technology quickly.", tags: ["Adaptability", "Learning"] },
    { text: "How do you prioritize tasks when working on multiple projects?", tags: ["Organization", "Planning"] },
    { text: "Tell me about a time you disagreed with a team member.", tags: ["Teamwork", "Conflict Resolution"] },
    { text: "What motivates you in your work?", tags: ["Motivation", "Values"] },
    { text: "Where do you see yourself in 5 years?", tags: ["Career Goals", "Planning"] },
    { text: "Describe your ideal work environment.", tags: ["Culture Fit", "Preferences"] },
    { text: "How do you stay updated with industry trends?", tags: ["Learning", "Growth"] },
    { text: "What's your greatest professional achievement?", tags: ["Achievement", "Impact"] },
    { text: "How do you handle constructive criticism?", tags: ["Feedback", "Growth"] },
    { text: "Do you have any questions for us?", tags: ["Engagement", "Interest"] }
];

function showInterviewModal() {
    currentQuestion = 0;
    answers = [];
    elapsedTime = 0;
    
    document.getElementById('interviewModal').classList.remove('hidden');
    loadQuestion();
    startTimer();
}

function loadQuestion() {
    const question = sampleQuestions[currentQuestion];
    
    document.getElementById('questionNumber').textContent = `${currentQuestion + 1}/${totalQuestions}`;
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('answerInput').value = '';
    
    const tagsContainer = document.getElementById('questionTags');
    tagsContainer.innerHTML = question.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    updateProgressRing();
}

function updateProgressRing() {
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;
    const circle = document.querySelector('.progress-circle');
    if (circle) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        elapsedTime++;
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function submitAnswer() {
    const answer = document.getElementById('answerInput').value.trim();
    
    if (!answer) {
        alert('Please provide an answer before continuing.');
        return;
    }
    
    answers.push({
        question: sampleQuestions[currentQuestion].text,
        answer: answer,
        time: elapsedTime
    });
    
    currentQuestion++;
    
    if (currentQuestion >= totalQuestions) {
        clearInterval(timerInterval);
        document.getElementById('interviewModal').classList.add('hidden');
        showResults();
    } else {
        loadQuestion();
    }
}

function showResults() {
    document.getElementById('resultsModal').classList.remove('hidden');
    
    const technicalScore = Math.floor(Math.random() * 20) + 75;
    const communicationScore = Math.floor(Math.random() * 20) + 70;
    const softSkillsScore = Math.floor(Math.random() * 20) + 72;
    const overallScore = Math.round((technicalScore + communicationScore + softSkillsScore) / 3);
    
    document.getElementById('overallScore').textContent = overallScore;
    document.getElementById('technicalScore').textContent = technicalScore + '%';
    document.getElementById('communicationScore').textContent = communicationScore + '%';
    document.getElementById('softSkillsScore').textContent = softSkillsScore + '%';
    
    document.getElementById('technicalBar').style.width = technicalScore + '%';
    document.getElementById('communicationBar').style.width = communicationScore + '%';
    document.getElementById('softSkillsBar').style.width = softSkillsScore + '%';
    
    const recommendation = document.getElementById('recommendation');
    if (overallScore >= 80) {
        recommendation.innerHTML = '<i class="fas fa-check-circle"></i><span>Strongly Recommended</span>';
        recommendation.style.background = 'rgba(0, 184, 163, 0.1)';
        recommendation.style.borderColor = 'rgba(0, 184, 163, 0.3)';
        recommendation.style.color = 'var(--accent-green)';
    } else if (overallScore >= 60) {
        recommendation.innerHTML = '<i class="fas fa-thumbs-up"></i><span>Recommended</span>';
    } else {
        recommendation.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Needs Improvement</span>';
        recommendation.style.background = 'rgba(239, 68, 68, 0.1)';
        recommendation.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        recommendation.style.color = 'var(--accent-red)';
    }
    
    const strengths = ['Clear communication', 'Good problem-solving approach', 'Strong technical knowledge'];
    const improvements = ['Could provide more specific examples', 'Consider structuring answers better'];
    
    document.getElementById('strengthsList').innerHTML = strengths.map(s => `<li>${s}</li>`).join('');
    document.getElementById('improvementsList').innerHTML = improvements.map(i => `<li>${i}</li>`).join('');
    
    const scoreRing = document.querySelector('.score-ring');
    if (scoreRing) {
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (overallScore / 100) * circumference;
        scoreRing.style.strokeDasharray = circumference;
        scoreRing.style.strokeDashoffset = offset;
    }
}

function resetUpload() {
    const uploadBox = document.getElementById('uploadBox');
    const uploadProgress = document.getElementById('uploadProgress');
    
    if (uploadBox) uploadBox.classList.remove('hidden');
    if (uploadProgress) uploadProgress.classList.add('hidden');
}

// ============================================
// LOADING
// ============================================

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}
