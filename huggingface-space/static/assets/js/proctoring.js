/**
 * Proctoring System - Camera and Audio Monitoring
 * - Face detection
 * - Looking away detection
 * - Audio monitoring
 * - Warning system (2 warnings max)
 */

class ProctoringSystem {
    constructor() {
        this.isActive = false;
        this.stream = null;
        this.videoElement = null;
        this.lookAwayCount = 0;
        this.maxLookAwayWarnings = 2;
        this.lookAwayTimer = null;
        this.lookAwayThreshold = 3000; // 3 seconds
        this.faceDetectionInterval = null;
        this.lastFaceDetected = Date.now();
        this.noFaceDetectedTime = 0;
        this.multipleFacesCount = 0;
        
        // BlazeFace model
        this.faceDetectionModel = null;
        
        // Audio monitoring
        this.audioContext = null;
        this.analyser = null;
        this.audioViolationCount = 0;
        this.maxAudioViolations = 2;
        this.audioThreshold = 30; // Lower threshold for better detection (0-100)
        this.suspiciousAudioDuration = 0;
        this.audioCheckInterval = null;
    }
    
    async startProctoring() {
        try {
            // Load face detection model
            console.log('Loading face detection model...');
            this.faceDetectionModel = await blazeface.load();
            console.log('Face detection model loaded');
            
            // Request camera and microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            // Create video element
            this.createVideoElement();
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            this.isActive = true;
            
            // Start face detection
            this.startFaceDetection();
            
            // Start audio monitoring
            this.startAudioMonitoring();
            
            // Log proctoring start
            this.logProctoringEvent('proctoring_started', {
                timestamp: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Proctoring error:', error);
            this.showProctoringError(error);
            return false;
        }
    }
    
    createVideoElement() {
        // Create video preview
        const videoContainer = document.createElement('div');
        videoContainer.id = 'proctoringVideo';
        videoContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 200px;
            height: 150px;
            border: 2px solid var(--color-primary);
            border-radius: var(--radius-lg);
            overflow: hidden;
            z-index: 9998;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scaleX(-1);
        `;
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        label.innerHTML = `
            <i class="fas fa-video" style="color: var(--color-success);"></i>
            <span>Proctoring Active</span>
        `;
        
        videoContainer.appendChild(this.videoElement);
        videoContainer.appendChild(label);
        document.body.appendChild(videoContainer);
    }
    
    startFaceDetection() {
        // Use BlazeFace for accurate face detection
        this.faceDetectionInterval = setInterval(() => {
            if (!this.isActive) return;
            
            this.detectFace();
        }, 1000); // Check every second
    }
    
    async detectFace() {
        try {
            if (!this.faceDetectionModel || !this.videoElement) return;
            
            // Detect faces using BlazeFace
            const predictions = await this.faceDetectionModel.estimateFaces(this.videoElement, false);
            
            const faceCount = predictions.length;
            
            // Update face count indicator
            this.updateFaceCountIndicator(faceCount);
            
            if (faceCount === 0) {
                // No face detected
                this.noFaceDetectedTime += 1000;
                
                if (this.noFaceDetectedTime >= this.lookAwayThreshold) {
                    this.handleNoFaceDetected();
                    this.noFaceDetectedTime = 0;
                }
            } else if (faceCount === 1) {
                // Exactly one face - good!
                this.noFaceDetectedTime = 0;
                this.lastFaceDetected = Date.now();
            } else if (faceCount > 1) {
                // Multiple faces detected
                this.handleMultipleFaces(faceCount);
            }
            
        } catch (error) {
            console.error('Face detection error:', error);
        }
    }
    
    handleNoFaceDetected() {
        this.lookAwayCount++;
        
        this.logProctoringEvent('no_face_detected', {
            count: this.lookAwayCount,
            timestamp: new Date().toISOString()
        });
        
        if (this.lookAwayCount >= this.maxLookAwayWarnings) {
            this.terminateExam();
        } else {
            const remaining = this.maxLookAwayWarnings - this.lookAwayCount;
            this.showWarning(
                `⚠️ NO FACE DETECTED!\n\nYou have ${remaining} warning(s) remaining.\n\nPlease look at the camera and stay in frame.`
            );
        }
    }
    
    handleMultipleFaces(count) {
        this.multipleFacesCount++;
        
        this.logProctoringEvent('multiple_faces_detected', {
            face_count: count,
            violation_count: this.multipleFacesCount,
            timestamp: new Date().toISOString()
        });
        
        if (this.multipleFacesCount >= 2) {
            this.terminateExamMultipleFaces(count);
        } else {
            this.showWarning(
                `⚠️ MULTIPLE PEOPLE DETECTED!\n\n${count} faces detected in frame.\n\nOnly the candidate should be visible.\n\nThis is your only warning.`
            );
        }
    }
    
    terminateExamMultipleFaces(count) {
        this.isActive = false;
        
        this.logProctoringEvent('exam_terminated', {
            reason: 'multiple_faces_detected',
            face_count: count,
            timestamp: new Date().toISOString()
        });
        
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-ban"></i>
                </div>
                <h3>Interview Terminated</h3>
                <p>Multiple people detected in the camera frame.</p>
                <p style="margin-top: 1rem;">Only the candidate should be visible during the interview.</p>
                <p style="margin-top: 1rem;">Your interview has been automatically submitted with current progress.</p>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn-primary" onclick="window.location.href='index.php'">
                        <span>Go to Home</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.stopProctoring();
    }
    
    updateFaceCountIndicator(count) {
        const videoContainer = document.getElementById('proctoringVideo');
        if (!videoContainer) return;
        
        let indicator = document.getElementById('faceCountIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'faceCountIndicator';
            indicator.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            `;
            videoContainer.appendChild(indicator);
        }
        
        if (count === 0) {
            indicator.style.background = 'rgba(239, 68, 68, 0.9)';
            indicator.innerHTML = '<i class="fas fa-user-slash"></i> No Face';
        } else if (count === 1) {
            indicator.style.background = 'rgba(16, 185, 129, 0.9)';
            indicator.innerHTML = '<i class="fas fa-user-check"></i> 1 Face';
        } else {
            indicator.style.background = 'rgba(239, 68, 68, 0.9)';
            indicator.innerHTML = `<i class="fas fa-users"></i> ${count} Faces`;
        }
    }
    
    handleLookingAway() {
        const timeSinceLastFace = Date.now() - this.lastFaceDetected;
        
        if (timeSinceLastFace > this.lookAwayThreshold && !this.lookAwayTimer) {
            this.lookAwayTimer = setTimeout(() => {
                this.lookAwayCount++;
                
                this.logProctoringEvent('looking_away', {
                    count: this.lookAwayCount,
                    timestamp: new Date().toISOString()
                });
                
                if (this.lookAwayCount >= this.maxLookAwayWarnings) {
                    this.terminateExam();
                } else {
                    const remaining = this.maxLookAwayWarnings - this.lookAwayCount;
                    this.showWarning(
                        `⚠️ FACE NOT DETECTED!\n\nYou have ${remaining} warning(s) remaining.\n\nPlease look at the camera and stay focused on the screen.`
                    );
                }
                
                this.lookAwayTimer = null;
            }, 1000);
        }
    }
    
    clearLookAwayTimer() {
        if (this.lookAwayTimer) {
            clearTimeout(this.lookAwayTimer);
            this.lookAwayTimer = null;
        }
    }
    
    terminateExam() {
        this.isActive = false;
        
        this.logProctoringEvent('exam_terminated', {
            reason: 'looking_away_exceeded',
            timestamp: new Date().toISOString()
        });
        
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-ban"></i>
                </div>
                <h3>Interview Terminated</h3>
                <p>You have been looking away from the screen for too long.</p>
                <p style="margin-top: 1rem;">Your interview has been automatically submitted with current progress.</p>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn-primary" onclick="window.location.href='index.php'">
                        <span>Go to Home</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.stopProctoring();
    }
    
    startAudioMonitoring() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            // Connect microphone to analyser
            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);
            
            // Start monitoring
            this.audioCheckInterval = setInterval(() => {
                this.checkAudioLevel();
            }, 500); // Check every 500ms
            
            // Add audio indicator to video preview
            this.addAudioIndicator();
            
        } catch (error) {
            console.error('Audio monitoring error:', error);
        }
    }
    
    checkAudioLevel() {
        if (!this.isActive || !this.analyser) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const volumePercent = (average / 255) * 100;
        
        // Update audio indicator
        this.updateAudioIndicator(volumePercent);
        
        // Check if volume exceeds threshold (someone speaking)
        if (volumePercent > this.audioThreshold) {
            this.suspiciousAudioDuration += 500; // Add 500ms
            
            // If speaking for more than 2 seconds (more sensitive)
            if (this.suspiciousAudioDuration >= 2000) {
                this.handleAudioViolation();
                this.suspiciousAudioDuration = 0;
            }
        } else {
            // Reset if quiet
            if (this.suspiciousAudioDuration > 0) {
                this.suspiciousAudioDuration = Math.max(0, this.suspiciousAudioDuration - 500);
            }
        }
    }
    
    handleAudioViolation() {
        this.audioViolationCount++;
        
        this.logProctoringEvent('audio_violation', {
            count: this.audioViolationCount,
            timestamp: new Date().toISOString()
        });
        
        if (this.audioViolationCount >= this.maxAudioViolations) {
            this.terminateExamAudio();
        } else {
            const remaining = this.maxAudioViolations - this.audioViolationCount;
            this.showWarning(
                `⚠️ SUSPICIOUS AUDIO DETECTED!\n\nVoice or conversation detected in the background.\n\nYou have ${remaining} warning(s) remaining.\n\nPlease ensure you are alone and silent during the interview.`
            );
        }
    }
    
    terminateExamAudio() {
        this.isActive = false;
        
        this.logProctoringEvent('exam_terminated', {
            reason: 'audio_violations_exceeded',
            timestamp: new Date().toISOString()
        });
        
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-ban"></i>
                </div>
                <h3>Interview Terminated</h3>
                <p>Multiple audio violations detected.</p>
                <p style="margin-top: 1rem;">Voice or conversation was detected in the background, which is not allowed during the interview.</p>
                <p style="margin-top: 1rem;">Your interview has been automatically submitted with current progress.</p>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn-primary" onclick="window.location.href='index.php'">
                        <span>Go to Home</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.stopProctoring();
    }
    
    addAudioIndicator() {
        const videoContainer = document.getElementById('proctoringVideo');
        if (!videoContainer) return;
        
        const audioIndicator = document.createElement('div');
        audioIndicator.id = 'audioIndicator';
        audioIndicator.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 5px;
            right: 5px;
            height: 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 4px;
            overflow: hidden;
        `;
        
        const audioBar = document.createElement('div');
        audioBar.id = 'audioBar';
        audioBar.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--color-success), var(--color-warning), var(--color-danger));
            transition: width 0.1s ease;
        `;
        
        const audioLabel = document.createElement('div');
        audioLabel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
            pointer-events: none;
        `;
        audioLabel.innerHTML = '<i class="fas fa-microphone"></i> Audio';
        
        audioIndicator.appendChild(audioBar);
        audioIndicator.appendChild(audioLabel);
        videoContainer.appendChild(audioIndicator);
    }
    
    updateAudioIndicator(volumePercent) {
        const audioBar = document.getElementById('audioBar');
        if (audioBar) {
            audioBar.style.width = `${Math.min(volumePercent, 100)}%`;
            
            // Change color based on volume
            if (volumePercent > this.audioThreshold) {
                audioBar.style.background = 'var(--color-danger)';
            } else {
                audioBar.style.background = 'linear-gradient(90deg, var(--color-success), var(--color-warning), var(--color-danger))';
            }
        }
    }
    
    stopProctoring() {
        this.isActive = false;
        
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
        }
        
        if (this.audioCheckInterval) {
            clearInterval(this.audioCheckInterval);
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        const videoContainer = document.getElementById('proctoringVideo');
        if (videoContainer) {
            videoContainer.remove();
        }
    }
    
    showWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'critical-warning-overlay show';
        warning.style.zIndex = '99999';
        warning.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Proctoring Warning</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">
                    <span>I Understand</span>
                </button>
            </div>
        `;
        document.body.appendChild(warning);
    }
    
    showProctoringError(error) {
        const errorMessage = error.name === 'NotAllowedError' 
            ? 'Camera and microphone access is required for this interview. Please allow access and refresh the page.'
            : 'Failed to access camera/microphone. Please check your device settings.';
        
        const overlay = document.createElement('div');
        overlay.className = 'critical-warning-overlay show';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div class="critical-warning-box">
                <div class="warning-icon">
                    <i class="fas fa-video-slash"></i>
                </div>
                <h3>Camera Access Required</h3>
                <p>${errorMessage}</p>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn-secondary" onclick="window.location.href='index.php'">
                        <span>Cancel</span>
                    </button>
                    <button class="btn-primary" onclick="window.location.reload()">
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    logProctoringEvent(eventType, data) {
        console.log(`PROCTORING EVENT: ${eventType}`, data);
        
        // Send to backend
        fetch(getApiUrl('log_security'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Session-Id': getSessionId()
            },
            body: JSON.stringify({
                event_type: eventType,
                data: data,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error('Failed to log proctoring event:', err));
    }
}

// Initialize proctoring system
const proctoringSystem = new ProctoringSystem();

// Export for global use
window.proctoringSystem = proctoringSystem;
