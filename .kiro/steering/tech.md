# Technology Stack

## Backend

- **Framework**: Flask (Python web framework)
- **AI/LLM**: Groq API with Mixtral-8x7b-32768 model
- **PDF Processing**: PyPDF2 for text extraction
- **Environment Management**: python-dotenv for configuration
- **CORS**: Flask-CORS for cross-origin requests

### Key Dependencies

```
Flask
Flask-Cors
groq
PyPDF2
python-dotenv
```

### Environment Variables

- `GROQ_API_KEY`: Required API key for Groq LLM service (must contain 'gsk_' prefix)
- `PORT`: Optional server port (defaults to 5000)

## Frontend

- **Framework**: Vanilla JavaScript (no framework)
- **Styling**: Tailwind CSS (via CDN)
- **PDF Generation**: jsPDF library
- **Architecture**: Single-page application with state management

## Common Commands

### Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run development server
python backend/app.py
```

### Running the Application

```bash
# Start backend server (from project root)
python backend/app.py

# Server runs on http://127.0.0.1:5000
# Frontend is served from /frontend/public/
```

### Environment Setup

Create `backend/.env` file with:
```
GROQ_API_KEY="your_groq_api_key_here"
```

## API Architecture

- RESTful API endpoints with JSON request/response
- Session management via `X-User-Session-Id` header
- In-memory session storage (not persistent)
- Manual JSON extraction from LLM responses (no structured output mode)
