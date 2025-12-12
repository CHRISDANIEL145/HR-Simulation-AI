/**
 * Exam Security System
 * - Tab switch detection (max 2 switches)
 * - Right-click disabled
 * - Copy/paste disabled
 * - Auto fullscreen
 * - Time limit per question (3 minutes)
 * - No going back to previous questions
 * - Browser restriction (Chrome-like only)
 * - Extension detection (block AI extensions)
 */

class ExamSecurity {
    constructor() {
        this.tabSwitchCount = 0;
        this.maxTabSwitches = 2;
        this.isExamMode = false;
        this.questionTimeLimit = 180; // 3 minutes in seconds
        this.questionTimer = null;
        this.currentQuestionStartTime = null;
        this.allowedBrowsers = ['chrome', 'edge', 'brave', 'opera'];
        this.blockedExtensions = [
            'chatgpt', 'copilot', 'grammarly', 'quillbot', 
            'jasper', 'writesonic', 'claude', 'bard'
        ];
        
        this.init();
    }
    
    init() {
        // Disable right-click
        document.addEventListener('contextmenu', (e) => {
            if (this.isExamMode) {
                e.preventDefault();
                this.showWarning('Right-click is disabled during the interview');
                return false;
            }
        });
        
        // Disable copy/cut/paste completely
        document.addEventListener('copy', (e) => {
            if (this.isExamMode) {
                e.preventDefault();
                this.showWarning('Copy is disabled during the interview');
            }
        });
        
        document.addEventListener('cut', (e) => {
            if (this.isExamMode) {
                e.preventDefault();
                this.showWarning('Cut is disabled during the interview');
            }
        });
        
        document.addEventListener('paste', (e) => {
            if (this.isExamMode) {
                e.preventDefault();
                this.showWarning('Paste is disabled during the interview');
            }
        });
        
        // Disable keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isExamMode) {
                // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                    (e.ctrlKey && e.key === 'u')) {
                    e.preventDefault();
                    this.showWarning('Developer tools are disabled during the interview');
                    return false;
                }
                
                // Disable Ctrl+C, Ctrl+V, Ctrl+X everywhere (no copy/paste allowed)
                if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                    e.preventDefault();
                    this.showWarning('Copy/Paste is disabled during the interview');
                    return false;
                }
            }
        });
        
        // Tab switch detection
        document.addEventListener('visibilitychange', () => {
            if (this.isExamMode && document.hidden) {
                // Don't count if user is interacting with iframe (coding editor)
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'IFRAME') {
                    console.log('Iframe interaction detected, not counting as tab switch');
                    return;
                }
                this.handleTabSwitch();
            }
        });
        
        // Window blur detection (switching to another window)
        window.addEventListener('blur', () => {
            if (this.isExamMode) {
                // Don't count if user is interacting with iframe (coding editor)
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'IFRAME') {
                    console.log('Iframe interaction detected, not counting as tab switch');
                    return;
                }
                
                // Add a small delay to check if it's really a tab switch
                setTimeout(() => {
                    if (!document.hasFocus()) {
                        this.handleTabSwitch();
                    }
                }, 100);
            }
        });
        
        // Prevent exit fullscreen
        document.addEventListener('fullscreenchange', () => {
            if (this.isExamMode && !document.fullscreenElement) {
                this.showWarning('Please stay in fullscreen mode during the interview');
                this.enterFullscreen();
            }
        });
    }
    
    handleTabSwitch() {
        this.tabSwitchCount++;
        
        console.log(`Tab switch detected: ${this.tabSwitchCount}/${this.maxTabSwitches}`);
        
        // Log to backend
        this.logSecurityEvent('tab_switch', {
            count: this.tabSwitchCount,
            timestamp: new Date().toISOString()
        });
        
        if (this.tabSwitchCount >= this.maxTabSwitches) {
            this.terminateExam();
        } else {
            const remaining = this.maxTabSwitches - this.tabSwitchCount;
            this.showCriticalWarning(
                `⚠️ TAB SWITCH DETECTED!\n\nYou have ${remaining} warning(s) remaining.\n\nSwitching tabs again will terminate your interview.`
            );
        }
    }
    
    terminateExam() {
        this.isExamMode = false;
        
        // Log termination
        this.logSecurityEvent('exam_terminated', {
            reason: 'exceeded_tab_switches',
            timestamp: new Date().toISOString()
        });
        
        // Show termination message
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-ban"></i>
                </div>
                <h3>Interview Terminated</h3>
                <p>You have exceeded the maximum number of tab switches (2).</p>
                <p style="margin-top: 1rem;">Your interview has been automatically submitted with current progress.</p>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn-primary" onclick="window.location.href='index.php'">
                        <span>Go to Home</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Auto-submit interview
        this.autoSubmitInterview();
    }
    
    async startExamMode() {
        // Check browser compatibility
        if (!this.checkBrowser()) {
            this.showBrowserError();
            return false;
        }
        
        // Check for AI extensions
        const hasBlockedExtensions = await this.detectExtensions();
        if (hasBlockedExtensions) {
            this.showExtensionError();
            return false;
        }
        
        // Don't activate exam mode yet - wait for proctoring to be set up
        this.tabSwitchCount = 0;
        
        // Enter fullscreen
        this.enterFullscreen();
        
        // Show security notice
        this.showSecurityNotice();
        
        // Log exam start
        this.logSecurityEvent('exam_started', {
            timestamp: new Date().toISOString(),
            browser: this.getBrowserInfo(),
            userAgent: navigator.userAgent
        });
        
        return true;
    }
    
    activateExamMode() {
        // Called after proctoring is set up
        this.isExamMode = true;
    }
    
    checkBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
        const isEdge = userAgent.includes('edg');
        const isBrave = userAgent.includes('brave');
        const isOpera = userAgent.includes('opr') || userAgent.includes('opera');
        
        return isChrome || isEdge || isBrave || isOpera;
    }
    
    getBrowserInfo() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('edg')) return 'Microsoft Edge';
        if (userAgent.includes('brave')) return 'Brave';
        if (userAgent.includes('opr') || userAgent.includes('opera')) return 'Opera';
        if (userAgent.includes('chrome')) return 'Google Chrome';
        return 'Unknown';
    }
    
    async detectExtensions() {
        // More specific AI extension detection to avoid false positives
        const extensionTests = [
            // ChatGPT specific elements
            { id: 'chatgpt', test: () => document.querySelector('[data-testid*="chatgpt"]') || document.querySelector('[class*="chatgpt-"]') },
            // Grammarly specific
            { id: 'grammarly', test: () => document.querySelector('grammarly-extension') || document.querySelector('grammarly-desktop-integration') },
            // Copilot specific
            { id: 'copilot', test: () => document.querySelector('[class*="copilot"]') || document.querySelector('[id*="copilot"]') }
        ];
        
        for (const test of extensionTests) {
            try {
                if (test.test()) {
                    console.warn(`Detected AI extension: ${test.id}`);
                    return true;
                }
            } catch (e) {
                // Extension detection blocked, continue
            }
        }
        
        // Don't check for generic extensions - too many false positives
        return false;
    }
    
    showBrowserError() {
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Unsupported Browser</h3>
                <p>This interview can only be taken on the following browsers:</p>
                <ul class="browser-list">
                    <li><i class="fab fa-chrome"></i> Google Chrome</li>
                    <li><i class="fab fa-edge"></i> Microsoft Edge</li>
                    <li><i class="fab fa-brave"></i> Brave Browser</li>
                    <li><i class="fab fa-opera"></i> Opera</li>
                </ul>
                <p style="margin-top: 1rem; color: var(--color-danger);">
                    <strong>Current Browser:</strong> ${this.getBrowserInfo()}
                </p>
                <button class="btn-primary" onclick="window.location.href='index.php'">
                    <span>Go Back</span>
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    showExtensionError() {
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-puzzle-piece"></i>
                </div>
                <h3>Extensions Detected</h3>
                <p>AI-powered browser extensions must be disabled before starting the interview.</p>
                <div class="extension-warning">
                    <p><strong>Commonly blocked extensions:</strong></p>
                    <ul class="extension-list">
                        <li>ChatGPT / AI Assistants</li>
                        <li>GitHub Copilot</li>
                        <li>Grammarly</li>
                        <li>QuillBot</li>
                        <li>Any AI writing tools</li>
                    </ul>
                </div>
                <p style="margin-top: 1rem;">
                    <strong>How to disable extensions:</strong><br>
                    1. Click the puzzle icon in your browser toolbar<br>
                    2. Disable all AI-related extensions<br>
                    3. Refresh this page and try again
                </p>
                <button class="btn-primary" onclick="window.location.reload()">
                    <span>Refresh Page</span>
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    endExamMode() {
        this.isExamMode = false;
        this.exitFullscreen();
        
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
    }
    
    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    startQuestionTimer(onTimeout, customTimeLimit = null) {
        this.currentQuestionStartTime = Date.now();
        // Use custom time limit if provided, otherwise use default
        let remainingTime = customTimeLimit || this.questionTimeLimit;
        
        // Update timer display
        const updateTimerDisplay = () => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Change color when time is running out (for coding: < 2 min, regular: < 30 sec)
                const warningThreshold = customTimeLimit ? 120 : 30;
                const dangerThreshold = customTimeLimit ? 60 : 30;
                
                if (remainingTime < dangerThreshold) {
                    timerElement.style.color = 'var(--color-danger)';
                } else if (remainingTime < warningThreshold) {
                    timerElement.style.color = 'var(--color-warning)';
                } else {
                    timerElement.style.color = 'var(--color-primary)';
                }
            }
        };
        
        updateTimerDisplay();
        
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
        
        this.questionTimer = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            
            // Warning based on question type
            if (customTimeLimit) {
                // Coding question - warn at 2 minutes
                if (remainingTime === 120) {
                    this.showWarning('⏰ 2 minutes remaining!');
                }
            } else {
                // Regular question - warn at 30 seconds
                if (remainingTime === 30) {
                    this.showWarning('⏰ 30 seconds remaining!');
                }
            }
            
            // Time's up
            if (remainingTime <= 0) {
                clearInterval(this.questionTimer);
                this.showWarning('⏰ Time is up! Moving to next question...');
                
                setTimeout(() => {
                    if (onTimeout) onTimeout();
                }, 1500);
            }
        }, 1000);
    }
    
    stopQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
    }
    
    getQuestionDuration() {
        if (this.currentQuestionStartTime) {
            const duration = Math.floor((Date.now() - this.currentQuestionStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return '00:00';
    }
    
    showSecurityNotice() {
        const notice = document.createElement('div');
        notice.className = 'security-notice';
        notice.innerHTML = `
            <div class="security-notice-content">
                <div class="security-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3>Interview Security Active</h3>
                <div class="security-info">
                    <p><strong>Browser:</strong> ${this.getBrowserInfo()}</p>
                    <p><strong>Mode:</strong> Secure Exam Mode</p>
                </div>
                <ul class="security-rules">
                    <li><i class="fas fa-check"></i> Fullscreen mode enabled</li>
                    <li><i class="fas fa-check"></i> Tab switching limited (2 warnings max)</li>
                    <li><i class="fas fa-check"></i> Right-click disabled</li>
                    <li><i class="fas fa-check"></i> Copy/paste disabled</li>
                    <li><i class="fas fa-check"></i> 3 minutes per question (auto-submit)</li>
                    <li><i class="fas fa-check"></i> No going back to previous questions</li>
                    <li><i class="fas fa-check"></i> AI extensions blocked</li>
                    <li><i class="fas fa-check"></i> Developer tools disabled</li>
                </ul>
                <div class="security-warning-box">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p><strong>Warning:</strong> Violating any security rule will result in automatic interview termination.</p>
                </div>
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">
                    <span>I Understand & Accept</span>
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notice);
    }
    
    showWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => warning.classList.add('show'), 100);
        
        setTimeout(() => {
            warning.classList.remove('show');
            setTimeout(() => warning.remove(), 300);
        }, 3000);
    }
    
    showCriticalWarning(message) {
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Security Warning</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">
                    <span>I Understand</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 100);
    }
    
    logSecurityEvent(eventType, data) {
        // Log to backend
        fetch(getApiUrl('log_security'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Session-Id': getSessionId()
            },
            body: JSON.stringify({
                event_type: eventType,
                data: data,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error('Failed to log security event:', err));
    }
    
    autoSubmitInterview() {
        // Auto-submit current answers
        console.log('Auto-submitting interview due to security violation');
        
        // Call assessment endpoint
        fetch(getApiUrl('get_assessment'), {
            method: 'GET',
            headers: {
                'X-User-Session-Id': getSessionId()
            }
        }).catch(err => console.error('Auto-submit failed:', err));
    }
}

// Initialize security system
const examSecurity = new ExamSecurity();

// Add security styles
const securityStyles = document.createElement('style');
securityStyles.textContent = `
.security-notice {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
}

.security-notice-content {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    max-width: 500px;
    text-align: center;
}

.security-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    margin: 0 auto var(--spacing-lg);
}

.security-rules {
    list-style: none;
    text-align: left;
    margin: var(--spacing-lg) 0;
}

.security-rules li {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) 0;
    color: var(--color-text-secondary);
}

.security-rules i {
    color: var(--color-success);
}

.security-info {
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin: var(--spacing-md) 0;
    text-align: left;
}

.security-info p {
    margin: var(--spacing-xs) 0;
    color: var(--color-text-secondary);
}

.security-warning-box {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin: var(--spacing-lg) 0;
    display: flex;
    align-items: start;
    gap: var(--spacing-sm);
    text-align: left;
}

.security-warning-box i {
    color: var(--color-danger);
    font-size: 20px;
    margin-top: 2px;
}

.security-warning-box p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
}

.browser-list, .extension-list {
    list-style: none;
    padding: 0;
    margin: var(--spacing-md) 0;
}

.browser-list li, .extension-list li {
    padding: var(--spacing-sm);
    background: rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-sm);
    margin: var(--spacing-xs) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.extension-warning {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin: var(--spacing-md) 0;
    text-align: left;
}

.security-warning {
    position: fixed;
    top: 100px;
    right: -400px;
    padding: var(--spacing-md) var(--spacing-lg);
    background: rgba(239, 68, 68, 0.95);
    border: 2px solid var(--color-danger);
    border-radius: var(--radius-lg);
    color: white;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    z-index: 99999;
    transition: right 0.3s ease;
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.5);
}

.security-warning.show {
    right: 20px;
}

.critical-warning-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.critical-warning-overlay.show {
    opacity: 1;
}

.critical-warning-box {
    background: var(--glass-bg);
    border: 2px solid var(--color-danger);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    max-width: 500px;
    text-align: center;
    animation: shake 0.5s;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}

.warning-icon {
    width: 100px;
    height: 100px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: var(--color-danger);
    margin: 0 auto var(--spacing-lg);
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.critical-warning-box h3 {
    font-size: 28px;
    color: var(--color-danger);
    margin-bottom: var(--spacing-md);
}

.critical-warning-box p {
    font-size: 16px;
    color: var(--color-text-secondary);
    line-height: 1.8;
    margin-bottom: var(--spacing-lg);
}
`;
document.head.appendChild(securityStyles);

// Export for global use
window.examSecurity = examSecurity;
