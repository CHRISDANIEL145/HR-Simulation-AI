"""
HR-AI Interview Simulation Platform - Full Flask Application
Deployed on Hugging Face Spaces with Docker
"""

import os
from flask import Flask, request, jsonify, render_template_string, send_from_directory
from flask_cors import CORS
from groq import Groq
import json
import uuid
import re
from datetime import datetime
from PyPDF2 import PdfReader
import io

# Configuration
API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = 'llama-3.3-70b-versatile'

app = Flask(__name__)
CORS(app)

# Initialize Groq client
client = None
if API_KEY:
    client = Groq(api_key=API_KEY)

# In-memory sessions
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
    text = ""
    try:
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"PDF Error: {e}")
        return ""


def extract_json_from_response(text):
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```|({\s*".*?"[\s\S]*})|(\[\s*[\s\S]*\])', text, re.DOTALL)
    if match:
        json_str = match.group(1) or match.group(2) or match.group(3)
        if json_str:
            try:
                return json.loads(json_str)
            except:
                pass
    if '{' in text and '}' in text:
        try:
            return json.loads(text[text.find('{'):text.rfind('}')+1])
        except:
            pass
    return None

def generate_content_with_groq(prompt):
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Return only valid JSON as requested."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=4096
        )
        content = response.choices[0].message.content
        if content:
            data = extract_json_from_response(content)
            if data:
                return json.dumps(data)
        return None
    except Exception as e:
        print(f"Groq Error: {e}")
        return None

# API Endpoints
@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    session_id = request.headers.get('X-User-Session-Id', str(uuid.uuid4()))
    session = get_or_create_session(session_id)
    
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    resume_content = extract_text_from_pdf(file)
    if not resume_content.strip():
        return jsonify({'error': 'Could not extract text from PDF'}), 400
    
    prompt = f"""Analyze this resume and extract: name, email, experience, key_skills (array), inferred_position.
Return JSON: {{"name":"","email":"","experience":"","key_skills":[],"inferred_position":""}}
Resume: {resume_content[:8000]}"""
    
    ai_response = generate_content_with_groq(prompt)
    if ai_response:
        profile = json.loads(ai_response)
        if not isinstance(profile.get('key_skills'), list):
            profile['key_skills'] = []
        session['candidate_profile'] = profile
        return jsonify({'message': 'Resume processed', 'candidate_profile': profile, 'session_id': session_id}), 200
    return jsonify({'error': 'AI failed to parse resume'}), 500

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
    prompt = f"""Generate 10 interview questions for {profile.get('name','Candidate')} applying for '{position}'.
Experience: {profile.get('experience','N/A')}. Skills: {skills}.
Generate: 6 Technical, 2 Soft Skills, 2 Communication questions.
Return: {{"questions":[{{"id":"q1","question":"...","tags":["technical"]}}]}}"""
    
    ai_response = generate_content_with_groq(prompt)
    if ai_response:
        result = json.loads(ai_response)
        questions = result.get('questions', [])
        session['interview_questions'] = questions
        session['interview_responses'] = []
        session['interview_start_time'] = datetime.now().isoformat()
        return jsonify({'message': 'Questions generated', 'questions': questions, 'is_coding_role': False}), 200
    return jsonify({'error': 'Failed to generate questions'}), 500


@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    data = request.get_json()
    question_id = data.get('question_id')
    response_text = data.get('response_text', '')
    duration = data.get('duration', '00:00')
    
    question_obj = next((q for q in session['interview_questions'] if q['id'] == question_id), None)
    if not question_obj:
        return jsonify({'error': 'Question not found'}), 404
    
    prompt = f"""Evaluate this interview response strictly:
Question: {question_obj['question']}
Answer: {response_text}
Return: {{"technicalScore":85,"communicationScore":90,"relevanceScore":88,"feedback":"..."}}"""
    
    ai_response = generate_content_with_groq(prompt)
    if ai_response:
        evaluation = json.loads(ai_response)
        score = (evaluation.get('technicalScore',0) + evaluation.get('communicationScore',0) + evaluation.get('relevanceScore',0)) / 3
        evaluation['score'] = round(score)
        
        session['interview_responses'].append({
            'question_id': question_id,
            'question': question_obj['question'],
            'tags': question_obj.get('tags', []),
            'response': response_text,
            'duration': duration,
            'evaluation': evaluation
        })
        return jsonify({'message': 'Answer evaluated', 'evaluation': evaluation}), 200
    return jsonify({'error': 'Evaluation failed'}), 500

@app.route('/get_assessment', methods=['GET'])
def get_assessment():
    session_id = request.headers.get('X-User-Session-Id')
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    if not session.get('interview_responses'):
        return jsonify({'error': 'No responses to assess'}), 400
    
    profile = session['candidate_profile']
    responses = session['interview_responses']
    
    summary = "\n".join([f"Q: {r['question'][:80]}... Score: {r['evaluation']['score']}%" for r in responses[:5]])
    avg_score = sum(r['evaluation']['score'] for r in responses) / len(responses)
    
    prompt = f"""Generate assessment for {profile.get('name','Candidate')}.
Average Score: {avg_score:.1f}%. Questions: {len(responses)}.
Summary: {summary}
Return: {{"overallScore":85,"recommendation":"Recommended","keyStrengths":["..."],"areasForImprovement":["..."],"detailedScores":{{"technicalSkills":85,"communication":80,"softSkills":78}}}}"""
    
    ai_response = generate_content_with_groq(prompt)
    if ai_response:
        assessment = json.loads(ai_response)
        assessment['detailedQuestionAnalysis'] = [{
            'question': r['question'],
            'score': r['evaluation']['score'],
            'technicalScore': r['evaluation'].get('technicalScore', 0),
            'communicationScore': r['evaluation'].get('communicationScore', 0),
            'relevanceScore': r['evaluation'].get('relevanceScore', 0)
        } for r in responses]
        return jsonify({'message': 'Assessment generated', 'assessment': assessment}), 200
    
    # Fallback
    return jsonify({'assessment': {
        'overallScore': round(avg_score),
        'recommendation': 'Recommended' if avg_score >= 70 else 'Needs Improvement',
        'keyStrengths': ['Completed interview'],
        'areasForImprovement': ['Review feedback'],
        'detailedScores': {'technicalSkills': round(avg_score), 'communication': round(avg_score), 'softSkills': round(avg_score)}
    }}), 200

@app.route('/log_security', methods=['POST'])
def log_security():
    return jsonify({'message': 'Logged'}), 200


# Main UI Route
@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HR-AI Interview Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); min-height: 100vh; color: #fff; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; }
        .header h1 { font-size: 2.5rem; background: linear-gradient(90deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header p { color: #a0aec0; margin-top: 10px; }
        .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1); }
        .card h2 { color: #667eea; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .upload-area { border: 2px dashed rgba(102,126,234,0.5); border-radius: 15px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; }
        .upload-area:hover { border-color: #667eea; background: rgba(102,126,234,0.1); }
        .upload-area i { font-size: 3rem; color: #667eea; margin-bottom: 15px; }
        input[type="file"] { display: none; }
        input[type="text"], textarea { width: 100%; padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; font-size: 1rem; margin: 10px 0; }
        textarea { min-height: 150px; resize: vertical; }
        .btn { padding: 15px 30px; border-radius: 10px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; gap: 10px; }
        .btn-primary { background: linear-gradient(90deg, #667eea, #764ba2); color: #fff; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102,126,234,0.4); }
        .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
        .hidden { display: none !important; }
        .profile-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .profile-item { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; }
        .profile-item label { color: #a0aec0; font-size: 0.85rem; }
        .profile-item span { display: block; font-weight: 600; margin-top: 5px; }
        .skills-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .skill-tag { background: rgba(102,126,234,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; }
        .question-box { background: rgba(102,126,234,0.1); padding: 25px; border-radius: 15px; margin: 20px 0; border-left: 4px solid #667eea; }
        .question-tags { display: flex; gap: 8px; margin-bottom: 10px; }
        .tag { background: rgba(118,75,162,0.3); padding: 4px 10px; border-radius: 15px; font-size: 0.75rem; }
        .progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; margin: 20px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }
        .score-display { text-align: center; padding: 30px; }
        .score-circle { width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(#667eea var(--score), rgba(255,255,255,0.1) 0); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .score-inner { width: 120px; height: 120px; border-radius: 50%; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-value { font-size: 2.5rem; font-weight: 700; }
        .score-label { color: #a0aec0; font-size: 0.9rem; }
        .recommendation { padding: 15px 25px; border-radius: 10px; display: inline-block; font-weight: 600; }
        .rec-high { background: rgba(72,187,120,0.2); color: #48bb78; }
        .rec-good { background: rgba(102,126,234,0.2); color: #667eea; }
        .rec-low { background: rgba(237,137,54,0.2); color: #ed8936; }
        .feedback-box { background: rgba(72,187,120,0.1); padding: 20px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #48bb78; }
        .loading { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; flex-direction: column; }
        .loading.show { display: flex; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .timer { font-size: 1.5rem; font-weight: 600; color: #667eea; }
        .actions { display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap; }
        .breakdown { margin-top: 20px; }
        .breakdown-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-robot"></i> HR-AI Interview Platform</h1>
            <p>AI-Powered Technical Interview Simulation</p>
        </div>

        <!-- Step 1: Upload Resume -->
        <div class="card" id="uploadSection">
            <h2><i class="fas fa-file-upload"></i> Step 1: Upload Resume</h2>
            <div class="upload-area" onclick="document.getElementById('resumeInput').click()">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Drop your resume here</h3>
                <p>or click to browse (PDF only)</p>
            </div>
            <input type="file" id="resumeInput" accept=".pdf" onchange="uploadResume(this.files[0])">
        </div>

        <!-- Step 2: Profile & Setup -->
        <div class="card hidden" id="setupSection">
            <h2><i class="fas fa-user-check"></i> Step 2: Candidate Profile</h2>
            <div class="profile-info" id="profileDisplay"></div>
            <div style="margin-top: 20px;">
                <label>Position/Role:</label>
                <input type="text" id="positionInput" placeholder="e.g., Senior Software Engineer">
            </div>
            <div class="actions">
                <button class="btn btn-primary" onclick="startInterview()"><i class="fas fa-play"></i> Start Interview</button>
            </div>
        </div>

        <!-- Step 3: Interview -->
        <div class="card hidden" id="interviewSection">
            <h2><i class="fas fa-comments"></i> Step 3: Interview</h2>
            <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width: 0%"></div></div>
            <p id="progressText">Question 1 of 10</p>
            <div class="question-box" id="questionBox"></div>
            <textarea id="answerInput" placeholder="Type your answer here..."></textarea>
            <div class="feedback-box hidden" id="feedbackBox"></div>
            <div class="actions">
                <button class="btn btn-primary" onclick="submitAnswer()"><i class="fas fa-paper-plane"></i> Submit Answer</button>
            </div>
        </div>

        <!-- Step 4: Assessment -->
        <div class="card hidden" id="assessmentSection">
            <h2><i class="fas fa-chart-pie"></i> Assessment Report</h2>
            <div class="score-display" id="scoreDisplay"></div>
            <div class="breakdown" id="breakdownDisplay"></div>
            <div class="actions">
                <button class="btn btn-secondary" onclick="location.reload()"><i class="fas fa-redo"></i> New Interview</button>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <p style="margin-top: 20px;" id="loadingText">Processing...</p>
    </div>

    <script>
        let sessionId = 'session_' + Date.now();
        let questions = [];
        let currentQuestion = 0;
        let responses = [];

        function showLoading(text) {
            document.getElementById('loadingText').textContent = text || 'Processing...';
            document.getElementById('loading').classList.add('show');
        }
        function hideLoading() { document.getElementById('loading').classList.remove('show'); }

        async function uploadResume(file) {
            if (!file) return;
            showLoading('Analyzing resume with AI...');
            
            const formData = new FormData();
            formData.append('resume', file);
            
            try {
                const resp = await fetch('/upload_resume', {
                    method: 'POST',
                    headers: { 'X-User-Session-Id': sessionId },
                    body: formData
                });
                const data = await resp.json();
                hideLoading();
                
                if (data.candidate_profile) {
                    const p = data.candidate_profile;
                    document.getElementById('profileDisplay').innerHTML = `
                        <div class="profile-item"><label>Name</label><span>${p.name || 'N/A'}</span></div>
                        <div class="profile-item"><label>Email</label><span>${p.email || 'N/A'}</span></div>
                        <div class="profile-item"><label>Experience</label><span>${p.experience || 'N/A'}</span></div>
                        <div class="profile-item"><label>Suggested Role</label><span>${p.inferred_position || 'N/A'}</span></div>
                        <div class="profile-item" style="grid-column: span 2;"><label>Skills</label>
                            <div class="skills-tags">${(p.key_skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                        </div>
                    `;
                    document.getElementById('positionInput').value = p.inferred_position || '';
                    document.getElementById('uploadSection').classList.add('hidden');
                    document.getElementById('setupSection').classList.remove('hidden');
                } else {
                    alert('Error: ' + (data.error || 'Failed to analyze resume'));
                }
            } catch (e) {
                hideLoading();
                alert('Error: ' + e.message);
            }
        }

        async function startInterview() {
            const position = document.getElementById('positionInput').value;
            if (!position) { alert('Please enter a position'); return; }
            
            showLoading('Generating interview questions...');
            try {
                const resp = await fetch('/setup_interview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-User-Session-Id': sessionId },
                    body: JSON.stringify({ position_role: position })
                });
                const data = await resp.json();
                hideLoading();
                
                if (data.questions) {
                    questions = data.questions;
                    currentQuestion = 0;
                    responses = [];
                    document.getElementById('setupSection').classList.add('hidden');
                    document.getElementById('interviewSection').classList.remove('hidden');
                    showQuestion();
                } else {
                    alert('Error: ' + (data.error || 'Failed to generate questions'));
                }
            } catch (e) {
                hideLoading();
                alert('Error: ' + e.message);
            }
        }

        function showQuestion() {
            const q = questions[currentQuestion];
            const progress = ((currentQuestion + 1) / questions.length) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
            document.getElementById('questionBox').innerHTML = `
                <div class="question-tags">${(q.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
                <p style="font-size: 1.1rem; line-height: 1.6;">${q.question}</p>
            `;
            document.getElementById('answerInput').value = '';
            document.getElementById('feedbackBox').classList.add('hidden');
        }

        async function submitAnswer() {
            const answer = document.getElementById('answerInput').value.trim();
            if (!answer) { alert('Please provide an answer'); return; }
            
            showLoading('Evaluating your answer...');
            try {
                const resp = await fetch('/submit_answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-User-Session-Id': sessionId },
                    body: JSON.stringify({
                        question_id: questions[currentQuestion].id,
                        response_text: answer,
                        duration: '02:00'
                    })
                });
                const data = await resp.json();
                hideLoading();
                
                if (data.evaluation) {
                    const e = data.evaluation;
                    responses.push({ question: questions[currentQuestion].question, evaluation: e });
                    
                    document.getElementById('feedbackBox').innerHTML = `
                        <strong>Score: ${e.score}/100</strong><br>
                        Technical: ${e.technicalScore}% | Communication: ${e.communicationScore}% | Relevance: ${e.relevanceScore}%<br>
                        <em>${e.feedback}</em>
                    `;
                    document.getElementById('feedbackBox').classList.remove('hidden');
                    
                    currentQuestion++;
                    if (currentQuestion < questions.length) {
                        setTimeout(showQuestion, 2000);
                    } else {
                        setTimeout(showAssessment, 2000);
                    }
                }
            } catch (e) {
                hideLoading();
                alert('Error: ' + e.message);
            }
        }

        async function showAssessment() {
            showLoading('Generating assessment report...');
            try {
                const resp = await fetch('/get_assessment', {
                    headers: { 'X-User-Session-Id': sessionId }
                });
                const data = await resp.json();
                hideLoading();
                
                if (data.assessment) {
                    const a = data.assessment;
                    const score = a.overallScore || 0;
                    const recClass = score >= 85 ? 'rec-high' : score >= 70 ? 'rec-good' : 'rec-low';
                    
                    document.getElementById('scoreDisplay').innerHTML = `
                        <div class="score-circle" style="--score: ${score * 3.6}deg">
                            <div class="score-inner">
                                <span class="score-value">${score}</span>
                                <span class="score-label">Overall</span>
                            </div>
                        </div>
                        <div class="recommendation ${recClass}">${a.recommendation || 'N/A'}</div>
                    `;
                    
                    let breakdown = '<h3>Detailed Scores</h3>';
                    if (a.detailedScores) {
                        breakdown += `
                            <div class="breakdown-item"><span>Technical Skills</span><span>${a.detailedScores.technicalSkills}%</span></div>
                            <div class="breakdown-item"><span>Communication</span><span>${a.detailedScores.communication}%</span></div>
                            <div class="breakdown-item"><span>Soft Skills</span><span>${a.detailedScores.softSkills}%</span></div>
                        `;
                    }
                    if (a.keyStrengths) {
                        breakdown += '<h3 style="margin-top:20px">Key Strengths</h3><ul>' + a.keyStrengths.map(s => `<li>${s}</li>`).join('') + '</ul>';
                    }
                    if (a.areasForImprovement) {
                        breakdown += '<h3 style="margin-top:20px">Areas for Improvement</h3><ul>' + a.areasForImprovement.map(s => `<li>${s}</li>`).join('') + '</ul>';
                    }
                    document.getElementById('breakdownDisplay').innerHTML = breakdown;
                    
                    document.getElementById('interviewSection').classList.add('hidden');
                    document.getElementById('assessmentSection').classList.remove('hidden');
                }
            } catch (e) {
                hideLoading();
                alert('Error: ' + e.message);
            }
        }
    </script>
</body>
</html>
'''

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)
