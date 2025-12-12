import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from groq import Groq
import json
import uuid
import re
from datetime import datetime
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

# Build an absolute path to the frontend/public directory. This is more reliable.
basedir = os.path.abspath(os.path.dirname(__file__))
static_folder_path = os.path.join(basedir, '..', 'frontend', 'public')

# Point Flask to the exact, absolute path for the static files.
app = Flask(__name__, static_folder=static_folder_path, static_url_path='')
CORS(app)

# --- Groq API Configuration ---
# Get the API key from environment variables
API_KEY = os.getenv('GROQ_API_KEY')
if not API_KEY or 'gsk_' not in API_KEY:
    raise ValueError("GROQ_API_KEY is not set or invalid. Please add it to your .env file.")

# ZeroGPT API Key (optional - add to .env if you have one)
ZEROGPT_API_KEY = os.getenv('ZEROGPT_API_KEY', '')

client = Groq(api_key=API_KEY)
# --- Updated to currently supported model ---
# Using llama-3.3-70b-versatile (recommended replacement)
GROQ_MODEL = 'llama-3.3-70b-versatile'

# --- Global State (in-memory session management) ---
sessions = {}

def get_or_create_session(session_id):
    if session_id not in sessions:
        sessions[session_id] = {
            'candidate_profile': None,
            'interview_questions': [],
            'interview_responses': [],
            'interview_start_time': None,
            'interview_end_time': None
        }
    return sessions[session_id]

# --- Static File Server ---
# This new route will serve your index.html file
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# --- Utility Functions ---

def extract_text_from_pdf(pdf_file):
    """
    Extracts text from an uploaded PDF file using PyPDF2.
    Returns the extracted text as a string.
    """
    text = ""
    try:
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def extract_json_from_response(text):
    """
    Extracts a JSON object or array from a string, handling markdown code blocks.
    """
    # Regex to find JSON wrapped in markdown or just the JSON itself
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```|({\s*".*?"[\s\S]*})|(\[\s*[\s\S]*\])', text, re.DOTALL)
    
    if match:
        json_str = match.group(1) or match.group(2) or match.group(3)
        if json_str:
            try:
                # Try parsing the extracted string
                return json.loads(json_str)
            except json.JSONDecodeError:
                print(f"DEBUG: Failed to decode extracted JSON: {json_str}")
                pass # Fall through to broader search if strict parse fails
    
    # Fallback: find the first '{' and last '}' or first '[' and last ']'
    json_str = None
    if '{' in text and '}' in text:
        try:
            json_str = text[text.find('{') : text.rfind('}')+1]
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"DEBUG: Fallback JSON object parsing failed: {e}")
            print(f"DEBUG: Substring was: {json_str}")
    
    if '[' in text and ']' in text:
        try:
            json_str = text[text.find('[') : text.rfind(']')+1]
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"DEBUG: Fallback JSON array parsing failed: {e}")
            print(f"DEBUG: Substring was: {json_str}")

    print("DEBUG: No valid JSON found in response.")
    return None

def generate_content_with_groq(prompt):
    """
    Helper to generate content safely with Groq, including error handling.
    This version does NOT use response_format and parses JSON manually.
    """
    system_prompt = "You are a helpful assistant that strictly follows instructions. You MUST return JSON objects as requested by the user. Do not add any explanatory text, apologies, or markdown formatting before or after the JSON object. Just return the raw JSON object and nothing else."
    
    try:
        print(f"DEBUG: Sending prompt to Groq with model {GROQ_MODEL}.")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=4096,
            top_p=1,
            stop=None,
            stream=False,
            # response_format={"type": "json_object"}, # Removing this for manual parsing
        )
        
        response_content = chat_completion.choices[0].message.content
        
        if response_content:
            print(f"DEBUG: Raw Groq response: {response_content}")
            # Try to extract JSON from the raw response
            json_data = extract_json_from_response(response_content)
            
            if json_data:
                # Re-serialize it to a string to match the original function's output type
                return json.dumps(json_data)
            else:
                print("DEBUG: Failed to extract JSON from Groq response.")
                return None
        else:
            print("DEBUG: Groq response was empty or malformed.")
            return None
    except Exception as e:
        print(f"DEBUG: Error calling Groq API: {e}")
        return None

# --- API Endpoints ---

@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    session_id = request.headers.get('X-User-Session-Id', str(uuid.uuid4()))
    session = get_or_create_session(session_id)

    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        resume_content = extract_text_from_pdf(file)
        
        if not resume_content.strip():
            return jsonify({'error': 'Could not extract text from the provided PDF. Please ensure it is a text-based PDF or its text is extractable.'}), 400

        prompt = f"""Analyze the following resume text and extract the candidate's name, email, total years of experience (if quantifiable, otherwise a brief summary like "2 roles (5 years)"), a list of key skills, and an inferred primary job role/position.
        
        Ensure the 'key_skills' is always a JSON array of strings, even if empty.
        
        Format the output strictly as a JSON object with the following keys: `name` (string), `email` (string), `experience` (string, e.g., "5 years" or "2 roles (5 years)"), `key_skills` (array of strings), `inferred_position` (string).
        
        Example JSON output:
        {{
          "name": "John Doe",
          "email": "john.doe@example.com",
          "experience": "5 years",
          "key_skills": ["Python", "Machine Learning", "Data Science"],
          "inferred_position": "Data Scientist"
        }}
        
        You MUST return ONLY the JSON object. Do not add any other text.

        Resume Text:
        ---
        {resume_content}
        ---
        """
        
        try:
            ai_response_text = generate_content_with_groq(prompt)
            
            if ai_response_text:
                print(f"DEBUG: Raw Groq response for resume_analyzer: {ai_response_text}")
                candidate_profile = json.loads(ai_response_text)
                
                if not isinstance(candidate_profile.get('key_skills'), list):
                    if isinstance(candidate_profile.get('key_skills'), str):
                        candidate_profile['key_skills'] = [s.strip() for s in candidate_profile['key_skills'].split(',') if s.strip()]
                    else:
                        candidate_profile['key_skills'] = []
                
                session['candidate_profile'] = candidate_profile
                return jsonify({'message': 'Resume processed successfully', 'candidate_profile': candidate_profile, 'session_id': session_id}), 200
            else:
                return jsonify({'error': 'AI failed to parse resume or returned empty response.'}), 500

        except json.JSONDecodeError as e:
            print(f"DEBUG: JSON Decode Error in /upload_resume: {e}")
            print(f"DEBUG: Raw AI response that caused error: {ai_response_text}")
            return jsonify({'error': f'Failed to parse AI response as JSON for resume upload: {e}. Raw AI response: {ai_response_text}'}), 500
        except ValueError as e: 
             print(f"DEBUG: Value Error in /upload_resume: {e}")
             return jsonify({'error': f'{str(e)}. Raw AI response: {ai_response_text}'}), 500
        except Exception as e:
            print(f"DEBUG: Error during resume processing in /upload_resume: {e}")
            return jsonify({'error': f'An unexpected error occurred during AI processing: {str(e)}'}), 500

@app.route('/setup_interview', methods=['POST'])
def setup_interview():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid or missing session ID'}), 400
    session = sessions[session_id]

    data = request.get_json()
    position_role = data.get('position_role')
    candidate_profile = session.get('candidate_profile') 

    if not position_role or not candidate_profile:
        return jsonify({'error': 'Position role and candidate profile are required'}), 400
    
    session['candidate_profile']['position'] = position_role

    skills = ", ".join(candidate_profile.get('key_skills', []))
    experience = candidate_profile.get('experience', 'N/A')
    candidate_name = candidate_profile.get('name', 'Candidate')
    
    # Detect if this is a coding/technical role
    coding_keywords = ['developer', 'engineer', 'programmer', 'software', 'backend', 'frontend', 'fullstack', 'full-stack', 'devops', 'data scientist', 'ml engineer', 'ai engineer', 'sre', 'qa automation', 'tech lead', 'architect']
    is_coding_role = any(keyword in position_role.lower() for keyword in coding_keywords) or any(keyword in skills.lower() for keyword in ['python', 'java', 'javascript', 'c++', 'react', 'node', 'django', 'flask', 'spring'])
    
    session['is_coding_role'] = is_coding_role
    
    coding_questions_text = ""
    if is_coding_role:
        coding_questions_text = """- 2 Coding Challenge questions (IMPORTANT: These MUST be simple, self-contained problems that can run in a browser without external libraries, databases, or file systems)

CODING QUESTION RULES:
1. NO external libraries (no requests, pandas, numpy, etc.) - only built-in functions
2. NO database queries (no SQL, no database connections)
3. NO file operations (no reading/writing files)
4. NO web scraping or API calls
5. ONLY use: basic math, strings, arrays/lists, loops, conditionals, functions
6. Problems should be solvable in 5-10 lines of code
7. Must have clear input/output that can be tested with print statements

GOOD EXAMPLES:
- Write a function to reverse a string
- Calculate factorial of a number
- Find the largest number in an array
- Check if a string is a palindrome
- Sum all even numbers from 1 to N
- Convert temperature from Celsius to Fahrenheit
- Find duplicate elements in an array
- Calculate Fibonacci sequence up to N terms

BAD EXAMPLES (DO NOT USE):
- Scrape data from a website
- Query a database
- Use pandas/numpy/requests libraries
- Read/write files
- Connect to APIs"""

    prompt = f"""As an expert interviewer, generate interview questions for a candidate named {candidate_name} applying for a '{position_role}' role.
    The candidate has {experience} of experience and these key skills: {skills}.
    
    Generate the following specific number of questions:
    - 10 Technical questions (theory, concepts, best practices - NO coding)
    - 3 Soft Skills questions
    - 2 Communication Skills questions
    {coding_questions_text}

    For each question, also provide 1-3 relevant tags. 
    - For coding questions, use tags: ["coding", "programming"]
    - For other questions, use tags like: 'technical', 'experience', 'soft skills', 'problem-solving', 'leadership', 'communication', 'project'
    
    Format the output strictly as a JSON array of objects, inside a single parent JSON object with a key 'questions'. Each object in the array should have the following keys:
    - `id`: A unique string ID for the question (e.g., "tech_1", "soft_1").
    - `question`: The interview question.
    - `tags`: An array of strings representing the tags.
    
    Example JSON format:
    {{
      "questions": [
        {{
          "id": "q1",
          "question": "Can you describe a challenging project you worked on and how you overcame obstacles?",
          "tags": ["experience", "problem-solving"]
        }},
        {{
          "id": "q2",
          "question": "Explain the concept of RESTful APIs and how you've used them in your projects.",
          "tags": ["technical", "api"]
        }}
      ]
    }}
    
    You MUST return ONLY the JSON object. Do not add any other text.
    """
    
    try:
        ai_response_text = generate_content_with_groq(prompt)

        if ai_response_text:
            print(f"DEBUG: Raw Groq response for question_generator: {ai_response_text}")
            response_data = json.loads(ai_response_text)
            questions = response_data.get("questions", [])

            if not questions:
                 raise ValueError("AI response did not contain a 'questions' array.")

            session['interview_questions'] = questions
            session['interview_responses'] = [] # Clear old responses
            session['interview_start_time'] = datetime.now().isoformat()
            
            # Check if coding role
            is_coding_role = session.get('is_coding_role', False)
            
            return jsonify({
                'message': 'Interview questions generated', 
                'questions': questions,
                'is_coding_role': is_coding_role
            }), 200
        else:
            return jsonify({'error': 'AI failed to generate questions or returned empty response.'}), 500

    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON Decode Error in /setup_interview: {e}")
        print(f"DEBUG: Raw AI response that caused error: {ai_response_text}")
        return jsonify({'error': f'Failed to parse AI response as JSON for interview setup: {e}. Raw AI response: {ai_response_text}'}), 500
    except ValueError as e:
        print(f"DEBUG: Value Error in /setup_interview: {e}")
        return jsonify({'error': f'{str(e)}. Raw AI response: {ai_response_text}'}), 500
    except Exception as e:
        print(f"DEBUG: Error during question generation in /setup_interview: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

def evaluate_code(code, question):
    """Evaluate submitted code using AI to check correctness"""
    prompt = f"""You are a code evaluator. Analyze the following code submission for a coding question.

Question: {question}

Submitted Code:
```
{code}
```

Evaluate the code based on:
1. **Correctness**: Does it solve the problem correctly?
2. **Logic**: Is the logic sound and efficient?
3. **Syntax**: Is the code syntactically correct?
4. **Output**: Would it produce the correct output?

Provide scores (0-100) for each criterion and overall feedback.

Return ONLY a JSON object:
{{
  "correctness": 85,
  "logic": 90,
  "syntax": 95,
  "overall_score": 90,
  "feedback": "Code is correct and well-written. Solves the problem efficiently.",
  "has_errors": false
}}

If the code has syntax errors or won't run, set has_errors to true and give low scores.
"""
    
    try:
        ai_response = generate_content_with_groq(prompt)
        if ai_response:
            return json.loads(ai_response)
        return {'correctness': 0, 'logic': 0, 'syntax': 0, 'overall_score': 0, 'feedback': 'Failed to evaluate code', 'has_errors': True}
    except Exception as e:
        print(f"DEBUG: Code evaluation error: {e}")
        return {'correctness': 0, 'logic': 0, 'syntax': 0, 'overall_score': 0, 'feedback': f'Evaluation error: {str(e)}', 'has_errors': True}

def detect_ai_content(text):
    """
    Detect if text is AI-generated using ZeroGPT API
    Returns: dict with 'is_ai_generated' (bool), 'ai_percentage' (float), 'confidence' (str)
    """
    if not text or len(text.strip()) < 10:
        return {'is_ai_generated': False, 'ai_percentage': 0, 'confidence': 'N/A', 'error': 'Text too short'}
    
    try:
        # ZeroGPT API endpoint (free public endpoint)
        url = "https://api.zerogpt.com/api/detect/detectText"
        
        payload = {
            "input_text": text
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        print(f"DEBUG: Calling ZeroGPT API with text length: {len(text)}")
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"DEBUG: ZeroGPT Response Status: {response.status_code}")
        print(f"DEBUG: ZeroGPT Response: {response.text[:500]}")
        
        if response.status_code == 200:
            result = response.json()
            
            # Parse ZeroGPT response - check multiple possible response formats
            data = result.get('data', result)  # Some APIs return data directly
            
            # Try different field names
            ai_percentage = (
                data.get('fakePercentage') or 
                data.get('ai_percentage') or 
                data.get('isHuman', 100) - 100 or  # If isHuman is 20, AI is 80
                0
            )
            
            # If isHuman field exists, convert it
            if 'isHuman' in data:
                ai_percentage = 100 - float(data['isHuman'])
            
            is_ai = ai_percentage > 50  # Consider >50% as AI-generated
            
            confidence = 'High' if ai_percentage > 70 else 'Medium' if ai_percentage > 40 else 'Low'
            
            return {
                'is_ai_generated': is_ai,
                'ai_percentage': round(ai_percentage, 2),
                'confidence': confidence,
                'details': data,
                'raw_response': result
            }
        else:
            print(f"DEBUG: ZeroGPT API error: {response.status_code} - {response.text}")
            return {'is_ai_generated': False, 'ai_percentage': 0, 'confidence': 'N/A', 'error': f'API error: {response.status_code}'}
            
    except requests.exceptions.Timeout:
        print(f"DEBUG: ZeroGPT API timeout")
        return {'is_ai_generated': False, 'ai_percentage': 0, 'confidence': 'N/A', 'error': 'API timeout'}
    except Exception as e:
        print(f"DEBUG: AI detection error: {type(e).__name__}: {e}")
        return {'is_ai_generated': False, 'ai_percentage': 0, 'confidence': 'N/A', 'error': str(e)}

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid or missing session ID'}), 400
    session = sessions[session_id]

    data = request.get_json()
    question_id = data.get('question_id')
    response_text = data.get('response_text')
    code_submission = data.get('code_submission', '')
    is_coding_question = data.get('is_coding_question', False)
    duration = data.get('duration')

    if not question_id or (response_text is None and not code_submission): # Allow empty string "" but not null
        return jsonify({'error': 'Question ID and response text are required'}), 400

    question_obj = next((q for q in session['interview_questions'] if q['id'] == question_id), None)
    if not question_obj:
        return jsonify({'error': 'Question not found in current session'}), 404
    
    # For coding questions, evaluate the code
    code_evaluation = None
    if is_coding_question and code_submission:
        code_evaluation = evaluate_code(code_submission, question_obj['question'])
        print(f"DEBUG: Code Evaluation Result: {code_evaluation}")
    
    # Detect AI-generated content
    ai_detection = detect_ai_content(response_text) if response_text else {'is_ai_generated': False, 'ai_percentage': 0}
    print(f"DEBUG: AI Detection Result: {ai_detection}")

    prompt = f"""You are a STRICT AI interviewer. Evaluate the following candidate's response to an interview question.

CRITICAL EVALUATION RULES:
1. If the response contains random letters, gibberish, or nonsense (e.g., "tdciyctiyt", "asdfgh"), give 0-10 scores
2. If the response is empty, very short (less than 10 words), or just says "I don't know", give 0-20 scores
3. If the response is completely irrelevant to the question, give 0-30 scores
4. If the response shows some understanding but lacks depth, give 40-60 scores
5. Only give 70+ scores for well-structured, relevant, and technically accurate responses

Provide a score out of 100 for:
- Technical accuracy (0-100): How technically correct and accurate is the answer?
- Communication clarity (0-100): How clear and well-articulated is the response?
- Relevance to question (0-100): How relevant is the answer to the specific question asked?

Also provide brief, honest feedback explaining the scores.

Format the output strictly as a JSON object with the following keys:
- `technicalScore`: (integer 0-100)
- `communicationScore`: (integer 0-100)
- `relevanceScore`: (integer 0-100)
- `feedback`: (string)

Example for GOOD response:
{{
  "technicalScore": 85,
  "communicationScore": 90,
  "relevanceScore": 88,
  "feedback": "The response was technically sound and clearly communicated, showing good understanding."
}}

Example for BAD/GIBBERISH response:
{{
  "technicalScore": 5,
  "communicationScore": 0,
  "relevanceScore": 0,
  "feedback": "The response contains random characters with no meaningful content. This does not answer the question."
}}

You MUST return ONLY the JSON object. Do not add any other text.

Question: "{question_obj['question']}"
Candidate's Response: "{response_text}"
"""
    
    try:
        ai_response_text = generate_content_with_groq(prompt)
        
        if ai_response_text:
            print(f"DEBUG: Raw Groq response for submit_answer: {ai_response_text}")
            evaluation = json.loads(ai_response_text)
            
            # For coding questions, combine code evaluation with explanation evaluation
            if code_evaluation:
                # Weight: 70% code correctness, 30% explanation
                code_score = code_evaluation.get('overall_score', 0)
                explanation_score = (evaluation.get('technicalScore', 0) + evaluation.get('communicationScore', 0) + evaluation.get('relevanceScore', 0)) / 3
                overall_q_score = (code_score * 0.7) + (explanation_score * 0.3)
                
                evaluation['code_evaluation'] = code_evaluation
                evaluation['code_score'] = code_score
                evaluation['explanation_score'] = round(explanation_score)
            else:
                overall_q_score = (evaluation.get('technicalScore', 0) + evaluation.get('communicationScore', 0) + evaluation.get('relevanceScore', 0)) / 3
            
            evaluation['score'] = round(overall_q_score)
            
            # Add AI detection results to evaluation
            evaluation['ai_detection'] = ai_detection
            
            # Penalize score if AI-generated content detected
            if ai_detection.get('is_ai_generated', False):
                penalty = ai_detection.get('ai_percentage', 0) * 0.5  # Up to 50% penalty
                evaluation['score'] = max(0, round(evaluation['score'] - penalty))
                evaluation['ai_warning'] = f"AI-generated content detected ({ai_detection.get('ai_percentage', 0)}%). Score adjusted."
            
            # Find if this question was already answered and update it, otherwise append
            existing_response_index = -1
            for i, res in enumerate(session['interview_responses']):
                if res['question_id'] == question_id:
                    existing_response_index = i
                    break

            new_response_data = {
                'question_id': question_id,
                'question': question_obj['question'],
                'tags': question_obj['tags'],
                'response': response_text,
                'duration': duration,
                'evaluation': evaluation
            }

            if existing_response_index != -1:
                session['interview_responses'][existing_response_index] = new_response_data
            else:
                session['interview_responses'].append(new_response_data)
            
            response_message = 'Answer submitted and evaluated'
            if ai_detection.get('is_ai_generated', False):
                response_message += f" (⚠️ AI content detected: {ai_detection.get('ai_percentage', 0):.1f}%)"
            
            return jsonify({
                'message': response_message, 
                'evaluation': evaluation,
                'ai_detection': ai_detection
            }), 200
        else:
            return jsonify({'error': 'AI failed to evaluate response or returned empty response.'}), 500

    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON Decode Error in /submit_answer: {e}")
        print(f"DEBUG: Raw AI response that caused error: {ai_response_text}")
        return jsonify({'error': f'Failed to parse AI response as JSON for answer evaluation: {e}. Raw AI response: {ai_response_text}'}), 500
    except ValueError as e:
        print(f"DEBUG: Value Error in /submit_answer: {e}")
        return jsonify({'error': f'{str(e)}. Raw AI response: {ai_response_text}'}), 500
    except Exception as e:
        print(f"DEBUG: Error during response evaluation in /submit_answer: {e}")
        return jsonify({'error': f'An unexpected error occurred during AI processing: {str(e)}'}), 500

@app.route('/get_assessment', methods=['GET'])
def get_assessment():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid or missing session ID'}), 400
    session = sessions[session_id]

    if not session.get('interview_responses'):
        return jsonify({'error': 'No interview responses to assess'}), 400
    
    # Check if we have any responses at all
    if len(session['interview_responses']) == 0:
        print(f"DEBUG: No responses submitted yet.")
        return jsonify({'error': 'No responses submitted. Please answer at least one question.'}), 400
    
    # Allow partial completion for assessment (at least 50% answered or all questions completed)
    min_required = max(1, len(session['interview_questions']) // 2)
    if len(session['interview_responses']) < min_required and len(session['interview_responses']) < len(session['interview_questions']):
        print(f"DEBUG: Not enough responses. {len(session['interview_responses'])}/{len(session['interview_questions'])} answered.")
        return jsonify({'error': f'Please answer at least {min_required} questions before requesting assessment.'}), 400

    session['interview_end_time'] = datetime.now().isoformat()

    candidate_profile = session['candidate_profile']
    interview_summary = []
    total_duration_seconds = 0

    for res in session['interview_responses']:
        if res.get('evaluation'): # Only include fully evaluated responses
            summary_part = (
                f"Q: {res['question']}\n"
                f"A: {res['response']}\n"
                f"Evaluation: Technical: {res['evaluation']['technicalScore']}%, "
                f"Communication: {res['evaluation']['communicationScore']}%, "
                f"Relevance: {res['evaluation']['relevanceScore']}%. "
                f"Feedback: {res['evaluation']['feedback']}"
            )
            interview_summary.append(summary_part)
            
            try:
                # Duration might be null if user skipped back/forth, handle this
                if res['duration']:
                    minutes, seconds = map(int, res['duration'].split(':'))
                    total_duration_seconds += (minutes * 60) + seconds
            except (ValueError, AttributeError, TypeError):
                pass # Skip duration calculation if it's missing or malformed
        else:
            print(f"DEBUG: Skipping response for question ID {res['question_id']} in assessment as it has no evaluation.")


    total_minutes = total_duration_seconds // 60
    total_remaining_seconds = total_duration_seconds % 60
    interview_duration_str = f"{total_minutes}m {total_remaining_seconds}s"

    prompt_responses = "\n\n".join(interview_summary)

    prompt = f"""Generate a comprehensive interview assessment report based on the following candidate profile and interview responses.
    
    Candidate Profile: {json.dumps(candidate_profile, indent=2)}
    
    Interview Questions and Responses:
    {'-'*30}
    {prompt_responses}
    {'-'*30}

    Overall Interview Duration: {interview_duration_str}

    Provide the assessment strictly as a JSON object with the following structure:
    - `overallScore`: (integer 0-100, aggregate score based on all responses)
    - `recommendation`: (string, e.g., "Highly Recommended", "Recommended", "Consider with Reservations", "Not Recommended")
    - `interviewDuration`: (string, e.g., "15m 30s")
    - `detailedScores`: (object with `technicalSkills`, `communication`, `softSkills` - each an integer 0-100, derived from the evaluations)
    - `detailedQuestionAnalysis`: (array of objects) Note: For this `detailedQuestionAnalysis` field, you MUST return an empty array `[]`. It will be populated by the server.
    - `keyStrengths`: (array of strings, summarizing positive feedback)
    - `areasForImprovement`: (array of strings, summarizing areas needing work)

    Example JSON output:
    {{
      "overallScore": 85,
      "recommendation": "Recommended",
      "interviewDuration": "12m 45s",
      "detailedScores": {{
        "technicalSkills": 88,
        "communication": 82,
        "softSkills": 85
      }},
      "detailedQuestionAnalysis": [],
      "keyStrengths": ["Strong technical foundation in Python.", "Clear communication and problem-solving examples."],
      "areasForImprovement": ["Could provide more depth on system design topics.", "Response to behavioral question was a bit generic."]
    }}
    
    You MUST return ONLY the JSON object. Do not add any other text.
    """

    try:
        ai_response_text = generate_content_with_groq(prompt)

        if ai_response_text:
            print(f"DEBUG: Raw Groq response for assessment_generator: {ai_response_text}")
            assessment = json.loads(ai_response_text)

            assessment['interviewDuration'] = interview_duration_str
            
            # Manually fill in the detailedQuestionAnalysis from session data
            detailed_analysis_from_session = []
            for res in session['interview_responses']:
                if res.get('evaluation'):
                    detailed_analysis_from_session.append({
                        "question": res['question'],
                        "response": res['response'],
                        "tags": res['tags'],
                        "score": res['evaluation'].get('score', 0),
                        "technicalScore": res['evaluation'].get('technicalScore', 0),
                        "communicationScore": res['evaluation'].get('communicationScore', 0),
                        "relevanceScore": res['evaluation'].get('relevanceScore', 0)
                    })
            
            assessment['detailedQuestionAnalysis'] = detailed_analysis_from_session
            
            session['interview_assessment'] = assessment
            return jsonify({'message': 'Assessment generated', 'assessment': assessment}), 200
        else:
            return jsonify({'error': 'AI failed to generate assessment or returned empty response.'}), 500

    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON Decode Error in /get_assessment: {e}")
        print(f"DEBUG: Raw AI response that caused error: {ai_response_text}")
        return jsonify({'error': f'Failed to parse AI response as JSON for assessment generation: {e}. Raw AI response: {ai_response_text}'}), 500
    except ValueError as e:
        print(f"DEBUG: Value Error in /get_assessment: {e}")
        return jsonify({'error': f'{str(e)}. Raw AI response: {ai_response_text}'}), 500
    except Exception as e:
        print(f"DEBUG: Error during assessment generation in /get_assessment: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/log_security', methods=['POST'])
def log_security():
    """Log security events from the frontend"""
    session_id = request.headers.get('X-User-Session-Id')
    data = request.get_json()
    
    event_type = data.get('event_type', 'unknown')
    event_data = data.get('data', {})
    
    print(f"SECURITY EVENT [{session_id}]: {event_type} - {event_data}")
    
    # Store in session if available
    if session_id and session_id in sessions:
        if 'security_events' not in sessions[session_id]:
            sessions[session_id]['security_events'] = []
        
        sessions[session_id]['security_events'].append({
            'type': event_type,
            'data': event_data,
            'timestamp': data.get('timestamp')
        })
    
    return jsonify({'message': 'Security event logged'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Flask app running on http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=True)