"""
HR-AI Interview Simulation Platform - Hugging Face Spaces Version
Gradio-based UI for AI-powered interview simulation
"""

import gradio as gr
import os
import json
import re
from datetime import datetime
from groq import Groq
from PyPDF2 import PdfReader
import io

# Configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = 'llama-3.3-70b-versatile'

# Initialize Groq client
client = None
if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)

# Session state
session_data = {
    'candidate_profile': None,
    'questions': [],
    'current_question': 0,
    'responses': [],
    'assessment': None
}

def extract_text_from_pdf(pdf_file):
    """Extract text from uploaded PDF"""
    text = ""
    try:
        if hasattr(pdf_file, 'read'):
            reader = PdfReader(pdf_file)
        else:
            reader = PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        return f"Error: {str(e)}"


def extract_json_from_response(text):
    """Extract JSON from AI response"""
    # Try markdown code block
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
    
    # Try direct JSON
    if '{' in text:
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            return json.loads(text[start:end])
        except:
            pass
    return None

def call_groq_api(prompt):
    """Call Groq API for AI responses"""
    if not client:
        return None
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Return only valid JSON as requested."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=4096
        )
        content = response.choices[0].message.content
        return extract_json_from_response(content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return None

def process_resume(pdf_file):
    """Process uploaded resume and extract profile"""
    global session_data
    
    if pdf_file is None:
        return "❌ Please upload a resume file", "", gr.update(visible=False)
    
    # Extract text
    resume_text = extract_text_from_pdf(pdf_file)
    if resume_text.startswith("Error"):
        return f"❌ {resume_text}", "", gr.update(visible=False)
    
    if not resume_text.strip():
        return "❌ Could not extract text from PDF", "", gr.update(visible=False)
    
    # Truncate and clean
    resume_text = resume_text[:8000]
    resume_text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', resume_text)
    
    prompt = f'''Extract information from this resume and return JSON:
{{"name": "Full Name", "email": "email@domain.com", "experience": "X years", "key_skills": ["Skill1", "Skill2"], "inferred_position": "Job Title"}}

Resume:
{resume_text}

Return ONLY the JSON object.'''
    
    profile = call_groq_api(prompt)
    
    if profile:
        session_data['candidate_profile'] = profile
        
        # Format profile display
        skills = ", ".join(profile.get('key_skills', [])[:10])
        profile_text = f"""
### ✅ Resume Analyzed Successfully!

**Name:** {profile.get('name', 'N/A')}
**Email:** {profile.get('email', 'N/A')}
**Experience:** {profile.get('experience', 'N/A')}
**Skills:** {skills}
**Suggested Role:** {profile.get('inferred_position', 'N/A')}
"""
        return profile_text, profile.get('inferred_position', ''), gr.update(visible=True)
    else:
        return "❌ Failed to analyze resume. Please check your API key.", "", gr.update(visible=False)


def start_interview(position_role):
    """Generate interview questions based on profile and role"""
    global session_data
    
    if not session_data['candidate_profile']:
        return "❌ Please upload a resume first", gr.update(visible=False), gr.update(visible=False)
    
    if not position_role.strip():
        return "❌ Please enter a position/role", gr.update(visible=False), gr.update(visible=False)
    
    profile = session_data['candidate_profile']
    skills = ", ".join(profile.get('key_skills', []))
    experience = profile.get('experience', 'N/A')
    name = profile.get('name', 'Candidate')
    
    prompt = f'''Generate 10 interview questions for {name} applying for "{position_role}".
Experience: {experience}. Skills: {skills}.

Generate mix of:
- 6 Technical questions
- 2 Soft skills questions  
- 2 Communication/behavioral questions

Return JSON:
{{"questions": [{{"id": "q1", "question": "...", "tags": ["technical"]}}]}}'''
    
    result = call_groq_api(prompt)
    
    if result and 'questions' in result:
        session_data['questions'] = result['questions']
        session_data['current_question'] = 0
        session_data['responses'] = []
        
        # Get first question
        q = session_data['questions'][0]
        tags = ", ".join(q.get('tags', []))
        question_text = f"""
### Question 1 of {len(session_data['questions'])}

**Tags:** {tags}

---

**{q['question']}**
"""
        return question_text, gr.update(visible=True), gr.update(visible=False)
    else:
        return "❌ Failed to generate questions", gr.update(visible=False), gr.update(visible=False)

def submit_answer(answer_text):
    """Submit answer and get evaluation"""
    global session_data
    
    if not answer_text.strip():
        return "❌ Please provide an answer", get_current_question(), gr.update(visible=True), gr.update(visible=False)
    
    current_idx = session_data['current_question']
    questions = session_data['questions']
    
    if current_idx >= len(questions):
        return "Interview complete!", "", gr.update(visible=False), gr.update(visible=True)
    
    question = questions[current_idx]
    
    # Evaluate answer
    prompt = f'''Evaluate this interview response. Be strict but fair.

Question: {question['question']}
Answer: {answer_text}

Return JSON:
{{"technicalScore": 85, "communicationScore": 90, "relevanceScore": 88, "feedback": "Brief feedback here"}}'''
    
    evaluation = call_groq_api(prompt)
    
    if evaluation:
        score = (evaluation.get('technicalScore', 0) + evaluation.get('communicationScore', 0) + evaluation.get('relevanceScore', 0)) / 3
        evaluation['score'] = round(score)
        
        session_data['responses'].append({
            'question': question['question'],
            'answer': answer_text,
            'evaluation': evaluation
        })
        
        feedback = f"""
### ✅ Answer Evaluated

**Score:** {evaluation['score']}/100

- Technical: {evaluation.get('technicalScore', 0)}%
- Communication: {evaluation.get('communicationScore', 0)}%
- Relevance: {evaluation.get('relevanceScore', 0)}%

**Feedback:** {evaluation.get('feedback', 'N/A')}

---
"""
        # Move to next question
        session_data['current_question'] += 1
        
        if session_data['current_question'] < len(questions):
            next_q = questions[session_data['current_question']]
            tags = ", ".join(next_q.get('tags', []))
            question_text = f"""
### Question {session_data['current_question'] + 1} of {len(questions)}

**Tags:** {tags}

---

**{next_q['question']}**
"""
            return feedback, question_text, gr.update(visible=True), gr.update(visible=False)
        else:
            return feedback + "\n\n🎉 **Interview Complete!** Click 'Get Assessment' to see your results.", "", gr.update(visible=False), gr.update(visible=True)
    else:
        return "❌ Failed to evaluate answer", get_current_question(), gr.update(visible=True), gr.update(visible=False)

def get_current_question():
    """Get current question text"""
    if not session_data['questions']:
        return ""
    
    idx = session_data['current_question']
    if idx >= len(session_data['questions']):
        return "Interview complete!"
    
    q = session_data['questions'][idx]
    tags = ", ".join(q.get('tags', []))
    return f"""
### Question {idx + 1} of {len(session_data['questions'])}

**Tags:** {tags}

---

**{q['question']}**
"""


def get_assessment():
    """Generate final assessment report"""
    global session_data
    
    if not session_data['responses']:
        return "❌ No responses to assess. Please complete the interview first."
    
    # Calculate scores
    total_score = sum(r['evaluation']['score'] for r in session_data['responses']) / len(session_data['responses'])
    
    # Build summary
    summary = []
    for r in session_data['responses']:
        summary.append(f"Q: {r['question'][:100]}...\nScore: {r['evaluation']['score']}%")
    
    prompt = f'''Generate interview assessment based on these results:

Candidate: {session_data['candidate_profile'].get('name', 'Candidate')}
Average Score: {total_score:.1f}%
Questions Answered: {len(session_data['responses'])}

Response Summary:
{chr(10).join(summary[:5])}

Return JSON:
{{"overallScore": 85, "recommendation": "Recommended", "keyStrengths": ["strength1", "strength2"], "areasForImprovement": ["area1", "area2"]}}'''
    
    assessment = call_groq_api(prompt)
    
    if assessment:
        session_data['assessment'] = assessment
        
        # Determine recommendation color
        score = assessment.get('overallScore', total_score)
        if score >= 85:
            rec_emoji = "🌟"
            rec_color = "Highly Recommended"
        elif score >= 70:
            rec_emoji = "✅"
            rec_color = "Recommended"
        elif score >= 50:
            rec_emoji = "⚠️"
            rec_color = "Consider with Reservations"
        else:
            rec_emoji = "❌"
            rec_color = "Not Recommended"
        
        strengths = "\n".join([f"  ✓ {s}" for s in assessment.get('keyStrengths', [])])
        improvements = "\n".join([f"  • {s}" for s in assessment.get('areasForImprovement', [])])
        
        # Build detailed breakdown
        breakdown = ""
        for i, r in enumerate(session_data['responses'], 1):
            e = r['evaluation']
            breakdown += f"""
**Q{i}:** {r['question'][:80]}...
- Score: {e['score']}% | Tech: {e.get('technicalScore', 0)}% | Comm: {e.get('communicationScore', 0)}% | Rel: {e.get('relevanceScore', 0)}%
"""
        
        report = f"""
# 📊 Interview Assessment Report

---

## Candidate Information
- **Name:** {session_data['candidate_profile'].get('name', 'N/A')}
- **Position:** {session_data['candidate_profile'].get('inferred_position', 'N/A')}
- **Experience:** {session_data['candidate_profile'].get('experience', 'N/A')}

---

## Overall Results

### {rec_emoji} Score: {score}/100

### Recommendation: {assessment.get('recommendation', rec_color)}

---

## Key Strengths
{strengths}

---

## Areas for Improvement
{improvements}

---

## Detailed Question Analysis
{breakdown}

---

*Assessment generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        return report
    else:
        # Fallback assessment
        return f"""
# 📊 Interview Assessment Report

## Overall Score: {total_score:.1f}/100

### Questions Answered: {len(session_data['responses'])}

### Recommendation: {'Recommended' if total_score >= 70 else 'Needs Improvement'}

*Assessment generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""

def reset_interview():
    """Reset all session data"""
    global session_data
    session_data = {
        'candidate_profile': None,
        'questions': [],
        'current_question': 0,
        'responses': [],
        'assessment': None
    }
    return "", "", gr.update(visible=False), gr.update(visible=False), gr.update(visible=False), ""


# Build Gradio Interface
with gr.Blocks(
    title="HR-AI Interview Simulation",
    theme=gr.themes.Soft(
        primary_hue="indigo",
        secondary_hue="purple",
    ),
    css="""
    .gradio-container { max-width: 900px !important; }
    .main-title { text-align: center; margin-bottom: 20px; }
    .section-box { border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; margin: 10px 0; }
    """
) as demo:
    
    gr.Markdown("""
    # 🤖 HR-AI Interview Simulation Platform
    
    **AI-Powered Technical Interview System** - Upload your resume, answer questions, and get instant evaluation!
    
    ---
    """)
    
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 📄 Step 1: Upload Resume")
            resume_file = gr.File(
                label="Upload Resume (PDF)",
                file_types=[".pdf"],
                type="filepath"
            )
            upload_btn = gr.Button("🔍 Analyze Resume", variant="primary")
            profile_output = gr.Markdown("")
    
    with gr.Row(visible=False) as setup_row:
        with gr.Column():
            gr.Markdown("### 💼 Step 2: Configure Interview")
            position_input = gr.Textbox(
                label="Position/Role",
                placeholder="e.g., Senior Software Engineer",
                lines=1
            )
            start_btn = gr.Button("🚀 Start Interview", variant="primary")
    
    with gr.Row(visible=False) as interview_row:
        with gr.Column():
            gr.Markdown("### 📝 Step 3: Answer Questions")
            question_display = gr.Markdown("")
            answer_input = gr.Textbox(
                label="Your Answer",
                placeholder="Type your response here...",
                lines=6
            )
            submit_btn = gr.Button("✅ Submit Answer", variant="primary")
            feedback_output = gr.Markdown("")
    
    with gr.Row(visible=False) as assessment_row:
        with gr.Column():
            assess_btn = gr.Button("📊 Get Assessment Report", variant="primary", size="lg")
    
    with gr.Row():
        with gr.Column():
            assessment_output = gr.Markdown("")
    
    with gr.Row():
        reset_btn = gr.Button("🔄 Start New Interview", variant="secondary")
    
    # Event handlers
    upload_btn.click(
        fn=process_resume,
        inputs=[resume_file],
        outputs=[profile_output, position_input, setup_row]
    )
    
    start_btn.click(
        fn=start_interview,
        inputs=[position_input],
        outputs=[question_display, interview_row, assessment_row]
    )
    
    submit_btn.click(
        fn=submit_answer,
        inputs=[answer_input],
        outputs=[feedback_output, question_display, interview_row, assessment_row]
    ).then(
        fn=lambda: "",
        outputs=[answer_input]
    )
    
    assess_btn.click(
        fn=get_assessment,
        outputs=[assessment_output]
    )
    
    reset_btn.click(
        fn=reset_interview,
        outputs=[profile_output, question_display, setup_row, interview_row, assessment_row, assessment_output]
    )

# Launch
if __name__ == "__main__":
    demo.launch()
