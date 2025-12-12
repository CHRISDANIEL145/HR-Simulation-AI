<?php
/**
 * HR-AI Interview Platform - PHP Backend Functions
 * Handles resume processing, interview setup, answer evaluation, and assessment generation
 */

/**
 * Call Groq API to generate AI content
 */
function callGroqAPI($prompt) {
    $systemPrompt = "You are a helpful assistant that strictly follows instructions. You MUST return JSON objects as requested by the user. Do not add any explanatory text, apologies, or markdown formatting before or after the JSON object. Just return the raw JSON object and nothing else.";
    
    $data = [
        'model' => GROQ_MODEL,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 4096,
        'top_p' => 1,
        'stream' => false
    ];
    
    $jsonPayload = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    
    $ch = curl_init(GROQ_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY,
        'Content-Length: ' . strlen($jsonPayload)
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("Groq API cURL Error: " . $curlError);
        return null;
    }
    
    if ($httpCode !== 200) {
        error_log("Groq API Error (HTTP $httpCode): " . $response);
        return null;
    }
    
    $result = json_decode($response, true);
    if (isset($result['choices'][0]['message']['content'])) {
        return extractJsonFromResponse($result['choices'][0]['message']['content']);
    }
    
    return null;
}

/**
 * Extract JSON from AI response text
 */
function extractJsonFromResponse($text) {
    // Try markdown code block first
    if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $text, $match)) {
        $decoded = json_decode($match[1], true);
        if ($decoded !== null) return $decoded;
    }
    
    // Try JSON object
    if (preg_match('/\{[\s\S]*\}/', $text, $match)) {
        $decoded = json_decode($match[0], true);
        if ($decoded !== null) return $decoded;
    }
    
    // Try JSON array
    if (preg_match('/\[[\s\S]*\]/', $text, $match)) {
        $decoded = json_decode($match[0], true);
        if ($decoded !== null) return $decoded;
    }
    
    return null;
}

/**
 * Extract text from PDF file
 */
function extractTextFromPDF($filePath) {
    $text = "";
    
    // Try pdftotext command
    $output = [];
    $returnVar = 0;
    exec("pdftotext " . escapeshellarg($filePath) . " -", $output, $returnVar);
    
    if ($returnVar === 0 && !empty($output)) {
        return implode("\n", $output);
    }
    
    // Fallback: raw PDF parsing
    $content = file_get_contents($filePath);
    if (preg_match_all('/\((.*?)\)/s', $content, $matches)) {
        $text = implode(' ', $matches[1]);
    }
    
    return $text;
}

/**
 * Handle resume upload and analysis
 */
function handleResumeUpload($sessionId) {
    if (!isset($_FILES['resume'])) {
        echo json_encode(['error' => 'No resume file provided']);
        http_response_code(400);
        return;
    }
    
    $file = $_FILES['resume'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => 'File upload error']);
        http_response_code(400);
        return;
    }
    
    $resumeContent = extractTextFromPDF($file['tmp_name']);
    
    if (empty(trim($resumeContent))) {
        echo json_encode(['error' => 'Could not extract text from PDF']);
        http_response_code(400);
        return;
    }
    
    // Clean and truncate content
    $resumeContent = substr($resumeContent, 0, 10000);
    $resumeContent = preg_replace('/[^\x20-\x7E\n\r\t]/', ' ', $resumeContent);
    $resumeContent = preg_replace('/\s+/', ' ', $resumeContent);
    $resumeContent = trim($resumeContent);
    
    $prompt = 'Extract information from this resume.

Return ONLY valid JSON:
{"name":"Full Name","email":"email@domain.com","experience":"X years","key_skills":["Skill1","Skill2"],"inferred_position":"Job Title"}

Resume:
' . $resumeContent . '

JSON:';
    
    $candidateProfile = callGroqAPI($prompt);
    
    if ($candidateProfile) {
        if (!is_array($candidateProfile['key_skills'] ?? null)) {
            $candidateProfile['key_skills'] = [];
        }
        
        $_SESSION['sessions'][$sessionId]['candidate_profile'] = $candidateProfile;
        
        echo json_encode([
            'message' => 'Resume processed successfully',
            'candidate_profile' => $candidateProfile,
            'session_id' => $sessionId
        ]);
        http_response_code(200);
    } else {
        echo json_encode(['error' => 'AI failed to parse resume']);
        http_response_code(500);
    }
}

/**
 * Handle interview setup and question generation
 */
function handleInterviewSetup($sessionId) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $positionRole = $data['position_role'] ?? '';
    $candidateProfile = $_SESSION['sessions'][$sessionId]['candidate_profile'] ?? null;
    
    if (empty($positionRole) || !$candidateProfile) {
        echo json_encode(['error' => 'Position role and candidate profile are required']);
        http_response_code(400);
        return;
    }
    
    $_SESSION['sessions'][$sessionId]['candidate_profile']['position'] = $positionRole;
    
    $skills = implode(', ', $candidateProfile['key_skills'] ?? []);
    $experience = $candidateProfile['experience'] ?? 'N/A';
    $candidateName = $candidateProfile['name'] ?? 'Candidate';
    
    // Detect coding role
    $codingKeywords = ['developer', 'engineer', 'programmer', 'software', 'backend', 'frontend', 'fullstack'];
    $isCodingRole = false;
    foreach ($codingKeywords as $keyword) {
        if (stripos($positionRole, $keyword) !== false || stripos($skills, $keyword) !== false) {
            $isCodingRole = true;
            break;
        }
    }
    
    $codingQuestionsText = $isCodingRole ? '- 2 Coding Challenge questions (simple, self-contained problems)' : '';
    
    $prompt = "Generate interview questions for {$candidateName} applying for '{$positionRole}'.
Experience: {$experience}. Skills: {$skills}.

Generate:
- 10 Technical questions
- 3 Soft Skills questions
- 2 Communication Skills questions
{$codingQuestionsText}

Return JSON:
{\"questions\": [{\"id\": \"q1\", \"question\": \"...\", \"tags\": [\"technical\"]}]}";
    
    $responseData = callGroqAPI($prompt);
    
    if ($responseData && isset($responseData['questions'])) {
        $_SESSION['sessions'][$sessionId]['interview_questions'] = $responseData['questions'];
        $_SESSION['sessions'][$sessionId]['interview_responses'] = [];
        $_SESSION['sessions'][$sessionId]['interview_start_time'] = date('c');
        $_SESSION['sessions'][$sessionId]['is_coding_role'] = $isCodingRole;
        
        echo json_encode([
            'message' => 'Interview questions generated',
            'questions' => $responseData['questions'],
            'is_coding_role' => $isCodingRole
        ]);
        http_response_code(200);
    } else {
        echo json_encode(['error' => 'AI failed to generate questions']);
        http_response_code(500);
    }
}

/**
 * Handle answer submission and evaluation
 */
function handleSubmitAnswer($sessionId) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $questionId = $data['question_id'] ?? '';
    $responseText = $data['response_text'] ?? '';
    $duration = $data['duration'] ?? '00:00';
    
    if (empty($questionId)) {
        echo json_encode(['error' => 'Question ID is required']);
        http_response_code(400);
        return;
    }
    
    $session = &$_SESSION['sessions'][$sessionId];
    $questionObj = null;
    
    foreach ($session['interview_questions'] as $q) {
        if ($q['id'] === $questionId) {
            $questionObj = $q;
            break;
        }
    }
    
    if (!$questionObj) {
        echo json_encode(['error' => 'Question not found']);
        http_response_code(404);
        return;
    }
    
    $prompt = "Evaluate this interview response.

Question: {$questionObj['question']}
Response: {$responseText}

Return JSON:
{\"technicalScore\": 85, \"communicationScore\": 90, \"relevanceScore\": 88, \"feedback\": \"...\"}";
    
    $evaluation = callGroqAPI($prompt);
    
    if ($evaluation) {
        $overallScore = ($evaluation['technicalScore'] + $evaluation['communicationScore'] + $evaluation['relevanceScore']) / 3;
        $evaluation['score'] = round($overallScore);
        
        $newResponse = [
            'question_id' => $questionId,
            'question' => $questionObj['question'],
            'tags' => $questionObj['tags'] ?? [],
            'response' => $responseText,
            'duration' => $duration,
            'evaluation' => $evaluation
        ];
        
        // Update or add response
        $found = false;
        foreach ($session['interview_responses'] as $i => $res) {
            if ($res['question_id'] === $questionId) {
                $session['interview_responses'][$i] = $newResponse;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $session['interview_responses'][] = $newResponse;
        }
        
        echo json_encode([
            'message' => 'Answer submitted and evaluated',
            'evaluation' => $evaluation
        ]);
        http_response_code(200);
    } else {
        echo json_encode(['error' => 'AI failed to evaluate response']);
        http_response_code(500);
    }
}

/**
 * Handle assessment generation
 */
function handleGetAssessment($sessionId) {
    $session = &$_SESSION['sessions'][$sessionId];
    
    if (empty($session['interview_responses'])) {
        echo json_encode(['error' => 'No interview responses to assess']);
        http_response_code(400);
        return;
    }
    
    $session['interview_end_time'] = date('c');
    $candidateProfile = $session['candidate_profile'];
    
    // Build interview summary
    $interviewSummary = [];
    $totalDuration = 0;
    
    foreach ($session['interview_responses'] as $res) {
        if (isset($res['evaluation'])) {
            $eval = $res['evaluation'];
            $interviewSummary[] = "Q: {$res['question']}\nA: {$res['response']}\nScores: Tech={$eval['technicalScore']}%, Comm={$eval['communicationScore']}%, Rel={$eval['relevanceScore']}%";
            
            if (!empty($res['duration'])) {
                $parts = explode(':', $res['duration']);
                if (count($parts) === 2) {
                    $totalDuration += (intval($parts[0]) * 60) + intval($parts[1]);
                }
            }
        }
    }
    
    $durationStr = floor($totalDuration / 60) . 'm ' . ($totalDuration % 60) . 's';
    $summaryText = implode("\n\n", $interviewSummary);
    
    $prompt = "Generate interview assessment for:
Profile: " . json_encode($candidateProfile) . "

Responses:
{$summaryText}

Duration: {$durationStr}

Return JSON:
{\"overallScore\": 85, \"recommendation\": \"Recommended\", \"interviewDuration\": \"{$durationStr}\", \"detailedScores\": {\"technicalSkills\": 88, \"communication\": 82, \"softSkills\": 85}, \"detailedQuestionAnalysis\": [], \"keyStrengths\": [\"...\"], \"areasForImprovement\": [\"...\"]}";
    
    $assessment = callGroqAPI($prompt);
    
    if ($assessment) {
        $assessment['interviewDuration'] = $durationStr;
        
        // Add detailed question analysis
        $detailedAnalysis = [];
        foreach ($session['interview_responses'] as $res) {
            if (isset($res['evaluation'])) {
                $detailedAnalysis[] = [
                    'question' => $res['question'],
                    'response' => $res['response'],
                    'tags' => $res['tags'] ?? [],
                    'score' => $res['evaluation']['score'] ?? 0,
                    'technicalScore' => $res['evaluation']['technicalScore'] ?? 0,
                    'communicationScore' => $res['evaluation']['communicationScore'] ?? 0,
                    'relevanceScore' => $res['evaluation']['relevanceScore'] ?? 0
                ];
            }
        }
        $assessment['detailedQuestionAnalysis'] = $detailedAnalysis;
        
        $session['interview_assessment'] = $assessment;
        
        echo json_encode([
            'message' => 'Assessment generated',
            'assessment' => $assessment
        ]);
        http_response_code(200);
    } else {
        echo json_encode(['error' => 'AI failed to generate assessment']);
        http_response_code(500);
    }
}
