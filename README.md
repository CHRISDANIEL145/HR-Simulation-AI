# 🤖 HR-AI Interview Simulation Platform

Application link:" https://huggingface.co/spaces/Danielchris145/HR-AI-Interview "

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![PHP](https://img.shields.io/badge/PHP-8.0+-purple.svg)](https://php.net)
[![Flask](https://img.shields.io/badge/Flask-3.x-green.svg)](https://flask.palletsprojects.com)
[![Groq](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-orange.svg)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Next-Generation AI-Powered Interview Platform** - Automate candidate screening with intelligent resume analysis, dynamic question generation, real-time evaluation, and comprehensive assessment reports.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Flow Diagrams](#-flow-diagrams)
- [Methodology](#-methodology)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Contributing](#-contributing)

---

## 🎯 Overview

The **HR-AI Interview Simulation Platform** is an intelligent recruitment solution that leverages advanced AI (Groq LLaMA 3.3 70B) to conduct automated technical interviews. The platform analyzes resumes, generates role-specific questions, evaluates responses in real-time, and produces comprehensive assessment reports.

### Key Objectives
- **Automate** initial candidate screening process
- **Standardize** interview evaluation criteria
- **Reduce** hiring time and human bias
- **Provide** data-driven hiring recommendations

---

## ✨ Features

### 🔹 Resume Processing
- PDF, DOC, DOCX file support
- AI-powered information extraction
- Automatic skill identification
- Experience calculation

### 🔹 Dynamic Question Generation
- Role-specific technical questions (10)
- Soft skills assessment (3)
- Communication evaluation (2)
- Coding challenges for technical roles (2)

### 🔹 Real-Time Evaluation
- Technical accuracy scoring (0-100)
- Communication clarity assessment
- Relevance analysis
- Instant feedback generation

### 🔹 Anti-Cheating System
- AI content detection (ZeroGPT integration)
- Browser extension blocking
- Tab-switching detection
- Camera/microphone proctoring
- Timed questions with auto-submit

### 🔹 Comprehensive Assessment
- Overall performance score
- Detailed skill breakdown
- Strengths & improvement areas
- Hiring recommendation

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HR-AI INTERVIEW PLATFORM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   FRONTEND      │    │   BACKEND       │    │   AI ENGINE     │         │
│  │   (PHP/HTML)    │◄──►│   (Python/PHP)  │◄──►│   (Groq API)    │         │
│  │                 │    │                 │    │                 │         │
│  │  • Premium UI   │    │  • Flask REST   │    │  • LLaMA 3.3    │         │
│  │  • Auth System  │    │  • Session Mgmt │    │  • 70B Model    │         │
│  │  • Proctoring   │    │  • File Upload  │    │  • JSON Output  │         │
│  │  • Code Editor  │    │  • Evaluation   │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      DATA FLOW LAYER                             │       │
│  │  Resume → Profile → Questions → Responses → Evaluation → Report │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | PHP 8.x, HTML5, CSS3, JavaScript | User interface, authentication, proctoring |
| **Backend API** | Python Flask | REST API, business logic, session management |
| **AI Engine** | Groq LLaMA 3.3 70B | Resume analysis, question generation, evaluation |
| **Security** | ZeroGPT, TensorFlow.js | AI detection, face monitoring, anti-cheat |

---

## 🛠 Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Primary backend language |
| Flask | 3.x | REST API framework |
| Flask-CORS | 6.x | Cross-origin resource sharing |
| Groq SDK | Latest | AI model integration |
| PyPDF2 | 3.x | PDF text extraction |
| python-dotenv | 1.x | Environment configuration |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | 8.x | Server-side rendering, auth |
| HTML5/CSS3 | - | UI structure and styling |
| JavaScript ES6+ | - | Client-side interactivity |
| TensorFlow.js | Latest | Face detection proctoring |
| jsPDF | 2.5 | PDF report generation |

### AI & Security
| Technology | Purpose |
|------------|---------|
| Groq LLaMA 3.3 70B | Resume analysis, Q&A generation, evaluation |
| ZeroGPT API | AI-generated content detection |
| BlazeFace | Real-time face detection |

---

## 📊 Flow Diagrams

### 1. Complete Interview Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INTERVIEW PROCESS FLOW                            │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │  START  │────►│ UPLOAD  │────►│ SETUP   │────►│INTERVIEW│────►│ ASSESS  │
    │         │     │ RESUME  │     │         │     │         │     │         │
    └─────────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
                         │               │               │               │
                         ▼               ▼               ▼               ▼
                   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
                   │ Extract  │   │ Generate │   │ Evaluate │   │ Generate │
                   │ Profile  │   │Questions │   │ Answers  │   │ Report   │
                   │ via AI   │   │ via AI   │   │ via AI   │   │ via AI   │
                   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 2. Resume Processing Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │    │   Extract   │    │   AI Parse  │    │   Return    │
│   PDF/DOC   │───►│   Text      │───►│   Profile   │───►│   JSON      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                  │
                          ▼                  ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  PyPDF2 /   │    │  Groq API   │
                   │  pdftotext  │    │  LLaMA 3.3  │
                   └─────────────┘    └─────────────┘

Output JSON:
{
  "name": "John Doe",
  "email": "john@example.com",
  "experience": "5 years",
  "key_skills": ["Python", "React", "AWS"],
  "inferred_position": "Full Stack Developer"
}
```

### 3. Question Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUESTION GENERATION PIPELINE                      │
└─────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │  Candidate   │
     │   Profile    │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐     ┌──────────────────────────────────────────┐
     │   Position   │────►│              AI PROMPT ENGINE             │
     │    Role      │     │                                          │
     └──────────────┘     │  "Generate interview questions for       │
                          │   {name} applying for {role} with        │
                          │   {experience} and skills: {skills}"     │
                          └──────────────────┬───────────────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                   ┌────────────┐     ┌────────────┐     ┌────────────┐
                   │ Technical  │     │ Soft Skills│     │  Coding    │
                   │ Questions  │     │ Questions  │     │ Challenges │
                   │   (10)     │     │   (3+2)    │     │   (2)      │
                   └────────────┘     └────────────┘     └────────────┘
```


### 4. Answer Evaluation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ANSWER EVALUATION PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌──────────┐
  │ Question │    │ Candidate│    │   AI EVALUATOR   │    │  Scores  │
  │          │───►│  Answer  │───►│                  │───►│          │
  └──────────┘    └──────────┘    │ • Technical: 85% │    │ Overall  │
                                  │ • Communic: 90%  │    │  Score   │
                       │          │ • Relevance: 88% │    │          │
                       ▼          └──────────────────┘    └──────────┘
                ┌──────────────┐
                │ AI Detection │
                │  (ZeroGPT)   │
                │              │
                │ If AI > 50%  │
                │ Apply Penalty│
                └──────────────┘
```

### 5. Security & Proctoring Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY MONITORING SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │       EXAM SECURITY LAYER       │
                    └─────────────────────────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
  ┌───────────┐  ┌───────────┐ ┌─────────┐ ┌─────────┐  ┌───────────┐
  │  Browser  │  │ Extension │ │  Tab    │ │ Camera  │  │   Timer   │
  │  Check    │  │  Blocker  │ │ Monitor │ │ Monitor │  │  Control  │
  └───────────┘  └───────────┘ └─────────┘ └─────────┘  └───────────┘
        │               │           │           │               │
        ▼               ▼           ▼           ▼               ▼
  ┌───────────┐  ┌───────────┐ ┌─────────┐ ┌─────────┐  ┌───────────┐
  │Chrome/Edge│  │Block AI   │ │Log Tab  │ │BlazeFace│  │Auto-Submit│
  │ Required  │  │Extensions │ │Switches │ │Detection│  │on Timeout │
  └───────────┘  └───────────┘ └─────────┘ └─────────┘  └───────────┘
```

---

## 📐 Methodology

### Development Methodology: Agile + AI-First

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT METHODOLOGY                               │
└─────────────────────────────────────────────────────────────────────────┘

  Phase 1: REQUIREMENTS          Phase 2: DESIGN           Phase 3: DEVELOP
  ┌─────────────────┐           ┌─────────────────┐       ┌─────────────────┐
  │ • User Stories  │           │ • Architecture  │       │ • Backend API   │
  │ • Feature List  │    ──►    │ • Data Models   │  ──►  │ • Frontend UI   │
  │ • AI Prompts    │           │ • API Design    │       │ • AI Integration│
  └─────────────────┘           └─────────────────┘       └─────────────────┘
                                                                   │
                                                                   ▼
  Phase 6: DEPLOY               Phase 5: TEST             Phase 4: INTEGRATE
  ┌─────────────────┐           ┌─────────────────┐       ┌─────────────────┐
  │ • Production    │           │ • Unit Tests    │       │ • API Testing   │
  │ • Monitoring    │    ◄──    │ • AI Validation │  ◄──  │ • Security Test │
  │ • Maintenance   │           │ • User Testing  │       │ • Performance   │
  └─────────────────┘           └─────────────────┘       └─────────────────┘
```

### AI Prompt Engineering Methodology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI PROMPT ENGINEERING PROCESS                         │
└─────────────────────────────────────────────────────────────────────────┘

  1. DEFINE TASK          2. STRUCTURE PROMPT       3. SPECIFY OUTPUT
  ┌─────────────┐         ┌─────────────────┐       ┌─────────────────┐
  │ What should │         │ System Role +   │       │ JSON Schema     │
  │ AI do?      │   ──►   │ User Context +  │  ──►  │ with Examples   │
  │             │         │ Instructions    │       │                 │
  └─────────────┘         └─────────────────┘       └─────────────────┘
                                                            │
                                                            ▼
  6. DEPLOY               5. VALIDATE               4. TEST & ITERATE
  ┌─────────────┐         ┌─────────────────┐       ┌─────────────────┐
  │ Production  │         │ Check JSON      │       │ Multiple Test   │
  │ Integration │   ◄──   │ Parse Success   │  ◄──  │ Cases           │
  │             │         │ Rate            │       │                 │
  └─────────────┘         └─────────────────┘       └─────────────────┘
```


### Evaluation Scoring Methodology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCORING METHODOLOGY                                   │
└─────────────────────────────────────────────────────────────────────────┘

  INDIVIDUAL QUESTION SCORE:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │   Score = (Technical + Communication + Relevance) / 3              │
  │                                                                     │
  │   For Coding Questions:                                            │
  │   Score = (Code_Score × 0.7) + (Explanation_Score × 0.3)          │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  AI DETECTION PENALTY:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │   If AI_Percentage > 50%:                                          │
  │       Penalty = AI_Percentage × 0.5                                │
  │       Final_Score = max(0, Score - Penalty)                        │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

  FINAL RECOMMENDATION:
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │   Score >= 85  →  "Highly Recommended"                             │
  │   Score >= 70  →  "Recommended"                                    │
  │   Score >= 50  →  "Consider with Reservations"                     │
  │   Score < 50   →  "Not Recommended"                                │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites

- Python 3.10 or higher
- PHP 8.0 or higher
- Git
- Groq API Key ([Get one here](https://console.groq.com))

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/CHRISDANIEL145/HR-Simulation-AI.git
cd HR-Simulation-AI

# 2. Create Python virtual environment
python -m venv .venv

# 3. Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 4. Install Python dependencies
pip install Flask Flask-Cors groq PyPDF2 python-dotenv requests

# 5. Configure environment variables
# Create backend/.env file with:
echo 'GROQ_API_KEY="your_groq_api_key_here"' > backend/.env

# 6. Start the Python backend (Terminal 1)
python backend/app.py

# 7. Start the PHP frontend (Terminal 2)
cd frontend-premium
php -S localhost:8000

# 8. Open browser
# Navigate to: http://localhost:8000
```

### Environment Configuration

Create `backend/.env`:
```env
GROQ_API_KEY="gsk_your_api_key_here"
ZEROGPT_API_KEY="your_zerogpt_key_here"  # Optional
```

---

## 📖 Usage Guide

### Step 1: Login/Signup
```
Navigate to http://localhost:8000
Create an account or login with existing credentials
```

### Step 2: Upload Resume
```
Click "Start Interview" or scroll to upload section
Drag & drop or click to upload PDF/DOC/DOCX resume
Wait for AI to analyze and extract profile
```

### Step 3: Configure Interview
```
Review extracted candidate profile
Enter or confirm the position/role
Click "Start Interview"
```

### Step 4: Pre-Exam Checklist
```
System checks:
✓ Browser compatibility
✓ Extension blocking
✓ Camera access
✓ Microphone access
✓ Question generation
```

### Step 5: Answer Questions
```
Read each question carefully
Type your response in the text area
For coding questions: Use the embedded IDE
Submit before timer expires (3 min regular, 20 min coding)
```

### Step 6: View Assessment
```
After all questions, view comprehensive report:
• Overall score
• Detailed breakdown
• Strengths & improvements
• Download PDF report
```


---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com/api
```

### Endpoints

#### 1. Upload Resume
```http
POST /upload_resume
Content-Type: multipart/form-data
Header: X-User-Session-Id: <session_id>

Body: resume (file)

Response:
{
  "message": "Resume processed successfully",
  "candidate_profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "experience": "5 years",
    "key_skills": ["Python", "React"],
    "inferred_position": "Software Engineer"
  },
  "session_id": "session_abc123"
}
```

#### 2. Setup Interview
```http
POST /setup_interview
Content-Type: application/json
Header: X-User-Session-Id: <session_id>

Body:
{
  "position_role": "Senior Software Engineer"
}

Response:
{
  "message": "Interview questions generated",
  "questions": [
    {
      "id": "tech_1",
      "question": "Explain the concept of...",
      "tags": ["technical", "python"]
    }
  ],
  "is_coding_role": true
}
```

#### 3. Submit Answer
```http
POST /submit_answer
Content-Type: application/json
Header: X-User-Session-Id: <session_id>

Body:
{
  "question_id": "tech_1",
  "response_text": "My answer is...",
  "code_submission": "def solution()...",  // For coding questions
  "is_coding_question": false,
  "duration": "02:30"
}

Response:
{
  "message": "Answer submitted and evaluated",
  "evaluation": {
    "technicalScore": 85,
    "communicationScore": 90,
    "relevanceScore": 88,
    "score": 88,
    "feedback": "Good technical understanding..."
  },
  "ai_detection": {
    "is_ai_generated": false,
    "ai_percentage": 12.5
  }
}
```

#### 4. Get Assessment
```http
GET /get_assessment
Header: X-User-Session-Id: <session_id>

Response:
{
  "message": "Assessment generated",
  "assessment": {
    "overallScore": 82,
    "recommendation": "Recommended",
    "interviewDuration": "25m 30s",
    "detailedScores": {
      "technicalSkills": 85,
      "communication": 80,
      "softSkills": 78
    },
    "keyStrengths": ["Strong Python skills", "Clear communication"],
    "areasForImprovement": ["System design depth"],
    "detailedQuestionAnalysis": [...]
  }
}
```

---

## 📁 Project Structure

```
HR-Simulation-AI/
│
├── 📂 backend/                    # Python Flask Backend
│   ├── app.py                     # Main Flask application
│   ├── config.php                 # PHP configuration
│   ├── functions.php              # PHP helper functions
│   ├── index.php                  # PHP entry point
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables
│   └── .env.php                   # PHP environment loader
│
├── 📂 backend-php/                # PHP Backend (Alternative)
│   ├── app.php                    # PHP API with Python proxy
│   └── document-parser.php        # Multi-format document parser
│
├── 📂 frontend-premium/           # Premium Frontend
│   ├── index.php                  # Main dashboard
│   ├── login.php                  # Authentication
│   ├── signup.php                 # Registration
│   ├── results.php                # Assessment results
│   │
│   └── 📂 assets/
│       ├── 📂 css/
│       │   ├── premium.css        # Main styles
│       │   └── auth.css           # Auth page styles
│       │
│       └── 📂 js/
│           ├── config.js          # API configuration
│           ├── premium-app.js     # Main application logic
│           ├── exam-security.js   # Anti-cheat system
│           ├── proctoring.js      # Camera monitoring
│           └── neural-bg.js       # Animated background
│
├── 📂 frontend/                   # Basic Frontend
│   └── 📂 public/
│       └── index.html             # Simple HTML interface
│
├── 📂 frontend-php/               # PHP Frontend
│   └── 📂 public/
│       └── index.html             # PHP-served interface
│
├── 📂 unified-app/                # Unified Application
│   ├── index.php                  # Combined entry point
│   └── 📂 backend/
│       └── config.php             # Unified configuration
│
├── .gitignore                     # Git ignore rules
└── README.md                      # This documentation
```


---

## 🔒 Security Features

### 1. Browser Security
```javascript
// Supported browsers only
const SUPPORTED_BROWSERS = ['Chrome', 'Edge', 'Brave', 'Opera'];

// Extension blocking
const BLOCKED_EXTENSIONS = [
  'ChatGPT', 'Grammarly AI', 'Jasper', 'Copy.ai',
  'Writesonic', 'QuillBot', 'Wordtune'
];
```

### 2. Exam Mode Restrictions
- Right-click disabled
- Copy/paste blocked
- Keyboard shortcuts disabled (Ctrl+C, Ctrl+V, F12)
- DevTools detection
- Tab visibility monitoring

### 3. Proctoring System
- Real-time face detection using BlazeFace
- Multiple face detection alerts
- No face detection warnings
- Audio level monitoring
- Periodic screenshot capture

### 4. AI Content Detection
- ZeroGPT API integration
- Percentage-based scoring
- Automatic score penalty for AI content
- Warning display to candidate

---

## 🔄 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

  USER                    FRONTEND                 BACKEND                AI
   │                         │                        │                    │
   │  1. Upload Resume       │                        │                    │
   │ ───────────────────────►│                        │                    │
   │                         │  2. POST /upload       │                    │
   │                         │ ──────────────────────►│                    │
   │                         │                        │  3. Parse Resume   │
   │                         │                        │ ──────────────────►│
   │                         │                        │  4. Profile JSON   │
   │                         │                        │ ◄──────────────────│
   │                         │  5. Profile Response   │                    │
   │                         │ ◄──────────────────────│                    │
   │  6. Show Profile        │                        │                    │
   │ ◄───────────────────────│                        │                    │
   │                         │                        │                    │
   │  7. Select Role         │                        │                    │
   │ ───────────────────────►│                        │                    │
   │                         │  8. POST /setup        │                    │
   │                         │ ──────────────────────►│                    │
   │                         │                        │  9. Gen Questions  │
   │                         │                        │ ──────────────────►│
   │                         │                        │  10. Questions     │
   │                         │                        │ ◄──────────────────│
   │                         │  11. Questions List    │                    │
   │                         │ ◄──────────────────────│                    │
   │  12. Show Questions     │                        │                    │
   │ ◄───────────────────────│                        │                    │
   │                         │                        │                    │
   │  13. Submit Answer      │                        │                    │
   │ ───────────────────────►│                        │                    │
   │                         │  14. POST /submit      │                    │
   │                         │ ──────────────────────►│                    │
   │                         │                        │  15. Evaluate      │
   │                         │                        │ ──────────────────►│
   │                         │                        │  16. Scores        │
   │                         │                        │ ◄──────────────────│
   │                         │  17. Evaluation        │                    │
   │                         │ ◄──────────────────────│                    │
   │  18. Show Feedback      │                        │                    │
   │ ◄───────────────────────│                        │                    │
   │                         │                        │                    │
   │  [Repeat 13-18 for all questions]               │                    │
   │                         │                        │                    │
   │  19. Request Assessment │                        │                    │
   │ ───────────────────────►│                        │                    │
   │                         │  20. GET /assessment   │                    │
   │                         │ ──────────────────────►│                    │
   │                         │                        │  21. Gen Report    │
   │                         │                        │ ──────────────────►│
   │                         │                        │  22. Assessment    │
   │                         │                        │ ◄──────────────────│
   │                         │  23. Full Report       │                    │
   │                         │ ◄──────────────────────│                    │
   │  24. Display Results    │                        │                    │
   │ ◄───────────────────────│                        │                    │
   │                         │                        │                    │
   ▼                         ▼                        ▼                    ▼
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Chris Daniel**
- GitHub: [@CHRISDANIEL145](https://github.com/CHRISDANIEL145)

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for the blazing-fast LLaMA inference
- [ZeroGPT](https://zerogpt.com) for AI content detection
- [TensorFlow.js](https://tensorflow.org/js) for browser-based ML
- [Flask](https://flask.palletsprojects.com) for the Python backend framework

---

<p align="center">
  Made with ❤️ for better hiring decisions
</p>
