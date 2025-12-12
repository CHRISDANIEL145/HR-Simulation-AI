# Project Structure

## Directory Organization

```
.
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application with all API endpoints
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables (API keys)
│   └── __pycache__/       # Python bytecode cache
│
├── frontend/               # Frontend application
│   └── public/            # Static files served by Flask
│       └── index.html     # Single-page application (HTML/CSS/JS)
│
├── .venv/                 # Python virtual environment
├── .vscode/               # VS Code configuration
├── .kiro/                 # Kiro AI assistant configuration
│   └── steering/          # AI steering documents
└── .git/                  # Git repository
```

## Backend Architecture

### Main Application (`backend/app.py`)

**Configuration & Setup**
- Flask app initialization with static file serving from `frontend/public/`
- CORS enabled for cross-origin requests
- Groq API client configuration with model selection

**Global State Management**
- In-memory session storage using dictionary
- Session data includes: candidate profile, questions, responses, timestamps, assessment

**Utility Functions**
- `extract_text_from_pdf()`: PDF text extraction using PyPDF2
- `extract_json_from_response()`: Parse JSON from LLM responses with fallback logic
- `generate_content_with_groq()`: Wrapper for Groq API calls with error handling
- `get_or_create_session()`: Session management helper

**API Endpoints**
- `GET /`: Serve frontend index.html
- `POST /upload_resume`: Process PDF resume and extract candidate profile
- `POST /setup_interview`: Generate interview questions based on role and profile
- `POST /submit_answer`: Evaluate individual question responses
- `GET /get_assessment`: Generate comprehensive interview assessment



## Frontend Architecture

### Single-Page Application (`frontend/public/index.html`)

**Application State**
- Global `appState` object managing current page, profile, questions, responses, session ID
- Page states: uploadResume, interviewSetup, interviewSession, interviewComplete

**Page Rendering Functions**
- `renderUploadResumePage()`: Resume upload interface
- `renderInterviewSetupPage()`: Profile review and role configuration
- `renderInterviewSessionPage()`: Question-by-question interview interface
- `renderInterviewCompletePage()`: Assessment results display

**Core Features**
- File upload handling with drag-and-drop
- Timer functionality for question duration tracking
- Progress bar for interview completion
- Custom alert/modal system
- Loading overlay for async operations

## Code Conventions

### Python (Backend)
- Snake_case for variables and functions
- Descriptive function names with action verbs
- Comprehensive error handling with try-except blocks
- Debug logging with `print()` statements prefixed with "DEBUG:"
- JSON response format for all API endpoints
- Session ID passed via `X-User-Session-Id` header

### JavaScript (Frontend)
- camelCase for variables and functions
- Global state management pattern
- Event-driven architecture
- Inline HTML generation using template literals
- Tailwind CSS utility classes for styling

## Data Flow

1. **Resume Upload**: PDF → Backend extraction → AI profile parsing → Session creation
2. **Interview Setup**: Profile + Role → AI question generation → Session storage
3. **Interview Session**: Question display → Response collection → AI evaluation → Session update
4. **Assessment**: All responses → AI comprehensive analysis → Final report generation
