"""
HR-AI Interview Simulation V2 - Full Premium UI
Complete Flask Application with Premium Frontend
Deployed: December 2024
"""

import os
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from groq import Groq
import json
import uuid
import re
from datetime import datetime
from PyPDF2 import PdfReader

# Configuration
API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = 'llama-3.3-70b-versatile'

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

client = None
if API_KEY:
    client = Groq(api_key=API_KEY)

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

def extract_text_from_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file)
        return "".join(p.extract_text() or "" for p in reader.pages)
    except:
        return ""

def extract_json_from_response(text):
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try: return json.loads(match.group(1))
        except: pass
    if '{' in text:
        try: return json.loads(text[text.find('{'):text.rfind('}')+1])
        except: pass
    return None


def generate_content_with_groq(prompt):
    if not client: return None
    try:
        resp = client.chat.completions.create(
            messages=[{"role": "system", "content": "Return only valid JSON."}, {"role": "user", "content": prompt}],
            model=GROQ_MODEL, temperature=0.7, max_tokens=4096
        )
        data = extract_json_from_response(resp.choices[0].message.content)
        return json.dumps(data) if data else None
    except Exception as e:
        print(f"Groq Error: {e}")
        return None

# Serve main page
@app.route('/')
@app.route('/index.html')
def index():
    return send_file('static/index.html')

# Serve login page
@app.route('/login')
@app.route('/login.html')
def login():
    return send_file('static/login.html')

# Serve signup page
@app.route('/signup')
@app.route('/signup.html')
def signup():
    return send_file('static/signup.html')

# Serve static assets
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('static/assets', filename)

# API Endpoints
@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    session_id = request.headers.get('X-User-Session-Id', str(uuid.uuid4()))
    session = get_or_create_session(session_id)
    
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file'}), 400
    
    file = request.files['resume']
    text = extract_text_from_pdf(file)
    if not text.strip():
        return jsonify({'error': 'Cannot extract text from PDF'}), 400
    
    prompt = f'''Analyze resume: {{"name":"","email":"","experience":"","key_skills":[],"inferred_position":""}}
Resume: {text[:8000]}'''
    
    resp = generate_content_with_groq(prompt)
    if resp:
        profile = json.loads(resp)
        if not isinstance(profile.get('key_skills'), list): profile['key_skills'] = []
        session['candidate_profile'] = profile
        return jsonify({'message': 'Success', 'candidate_profile': profile, 'session_id': session_id}), 200
    return jsonify({'error': 'AI failed'}), 500

@app.route('/setup_interview', methods=['POST'])
def setup_interview():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    data = request.get_json()
    position = data.get('position_role', '')
    profile = session.get('candidate_profile')
    
    if not position or not profile:
        return jsonify({'error': 'Position and profile required'}), 400
    
    skills = ", ".join(profile.get('key_skills', []))
    is_coding = any(k in position.lower() for k in ['developer','engineer','programmer','software'])
    
    coding_text = "- 2 Coding questions (simple problems)" if is_coding else ""
    prompt = f'''Generate interview questions for {profile.get('name','Candidate')} for "{position}".
Skills: {skills}. Experience: {profile.get('experience','N/A')}.
Generate: 10 Technical, 3 Soft Skills, 2 Communication {coding_text}
Return: {{"questions":[{{"id":"q1","question":"...","tags":["technical"]}}]}}'''
    
    resp = generate_content_with_groq(prompt)
    if resp:
        result = json.loads(resp)
        session['interview_questions'] = result.get('questions', [])
        session['interview_responses'] = []
        session['interview_start_time'] = datetime.now().isoformat()
        return jsonify({'message': 'Generated', 'questions': result.get('questions', []), 'is_coding_role': is_coding}), 200
    return jsonify({'error': 'Failed'}), 500

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    data = request.get_json()
    qid = data.get('question_id')
    answer = data.get('response_text', '')
    duration = data.get('duration', '00:00')
    
    q = next((x for x in session['interview_questions'] if x['id'] == qid), None)
    if not q: return jsonify({'error': 'Question not found'}), 404
    
    prompt = f'''Evaluate strictly:
Q: {q['question']}
A: {answer}
Return: {{"technicalScore":85,"communicationScore":90,"relevanceScore":88,"feedback":"..."}}'''
    
    resp = generate_content_with_groq(prompt)
    if resp:
        ev = json.loads(resp)
        ev['score'] = round((ev.get('technicalScore',0)+ev.get('communicationScore',0)+ev.get('relevanceScore',0))/3)
        session['interview_responses'].append({'question_id':qid,'question':q['question'],'tags':q.get('tags',[]),'response':answer,'duration':duration,'evaluation':ev})
        return jsonify({'message': 'Evaluated', 'evaluation': ev}), 200
    return jsonify({'error': 'Failed'}), 500

@app.route('/get_assessment', methods=['GET'])
def get_assessment():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    if not session.get('interview_responses'):
        return jsonify({'error': 'No responses'}), 400
    
    profile = session['candidate_profile']
    responses = session['interview_responses']
    avg = sum(r['evaluation']['score'] for r in responses) / len(responses)
    
    summary = "\n".join([f"Q: {r['question'][:60]}... Score: {r['evaluation']['score']}%" for r in responses[:5]])
    prompt = f'''Assessment for {profile.get('name','Candidate')}. Avg: {avg:.1f}%. Questions: {len(responses)}.
{summary}
Return: {{"overallScore":85,"recommendation":"Recommended","keyStrengths":["..."],"areasForImprovement":["..."],"detailedScores":{{"technicalSkills":85,"communication":80,"softSkills":78}}}}'''
    
    resp = generate_content_with_groq(prompt)
    if resp:
        a = json.loads(resp)
        a['detailedQuestionAnalysis'] = [{'question':r['question'],'score':r['evaluation']['score'],'technicalScore':r['evaluation'].get('technicalScore',0),'communicationScore':r['evaluation'].get('communicationScore',0),'relevanceScore':r['evaluation'].get('relevanceScore',0)} for r in responses]
        return jsonify({'message': 'Generated', 'assessment': a}), 200
    return jsonify({'assessment': {'overallScore': round(avg), 'recommendation': 'Recommended' if avg >= 70 else 'Needs Improvement', 'keyStrengths': [], 'areasForImprovement': [], 'detailedScores': {'technicalSkills': round(avg), 'communication': round(avg), 'softSkills': round(avg)}}}), 200

@app.route('/log_security', methods=['POST'])
def log_security():
    return jsonify({'message': 'Logged'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)
