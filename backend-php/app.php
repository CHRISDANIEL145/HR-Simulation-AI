<?php
// Load environment variables from .env file
require_once __DIR__ . '/../backend/.env.php';

// Configuration
define('GROQ_API_KEY', $_ENV['GROQ_API_KEY'] ?? '');
define('GROQ_MODEL', 'llama-3.3-70b-versatile');
define('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions');

if (empty(GROQ_API_KEY) || strpos(GROQ_API_KEY, 'gsk_') === false) {
    die('GROQ_API_KEY is not set or invalid. Please add it to your .env file.');
}

// Start session for state management
session_start();

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Session-Id');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Build absolute path to frontend/public directory
$basedir = __DIR__;
$static_folder_path = realpath($basedir . '/../frontend-php/public');

// Route handling
$request_uri = $_SERVER['REQUEST_URI'];
$request_path = parse_url($request_uri, PHP_URL_PATH);

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    
    $endpoint = basename($request_path);
    
    switch ($endpoint) {
        case 'upload_resume':
            upload_resume();
            break;
        case 'setup_interview':
            setup_interview();
            break;
        case 'submit_answer':
            submit_answer();
            break;
        case 'get_assessment':
            get_assessment();
            break;
        case 'log_security':
            log_security();
            break;
        default:
            echo json_encode(['error' => 'Invalid endpoint']);
    }
    exit;
}

// Serve static files
if ($request_path !== '/' && file_exists($static_folder_path . $request_path)) {
    $file_path = $static_folder_path . $request_path;
    $mime_types = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon'
    ];
    
    $ext = pathinfo($file_path, PATHINFO_EXTENSION);
    $mime_type = $mime_types[$ext] ?? 'application/octet-stream';
    
    header('Content-Type: ' . $mime_type);
    readfile($file_path);
    exit;
}

// Serve index.html for root and all other routes
$index_path = $static_folder_path . '/index.html';
if (file_exists($index_path)) {
    header('Content-Type: text/html');
    readfile($index_path);
    exit;
}

http_response_code(404);
echo '404 - Not Found';

// === Utility Functions ===

function get_or_create_session($session_id) {
    if (!isset($_SESSION['sessions'])) {
        $_SESSION['sessions'] = [];
    }
    
    if (!isset($_SESSION['sessions'][$session_id])) {
        $_SESSION['sessions'][$session_id] = [
            'candidate_profile' => null,
            'interview_questions' => [],
            'interview_responses' => [],
            'interview_start_time' => null,
            'interview_end_time' => null
        ];
    }
    
    return $_SESSION['sessions'][$session_id];
}

function extract_text_from_pdf($pdf_file) {
    $text = "";
    try {
        // Try using pdftotext command if available
        $output = [];
        $return_var = 0;
        exec("pdftotext " . escapeshellarg($pdf_file) . " -", $output, $return_var);
        
        if ($return_var === 0 && !empty($output)) {
            $text = implode("\n", $output);
        } else {
            // Fallback: try to read raw content and extract readable text
            $content = file_get_contents($pdf_file);
            // Extract text between common PDF text markers
            if (preg_match_all('/\((.*?)\)/s', $content, $matches)) {
                $text = implode(' ', $matches[1]);
            }
            // Also try BT/ET blocks
            if (preg_match_all('/BT\s+(.*?)\s+ET/s', $content, $matches)) {
                $text .= ' ' . implode(' ', $matches[1]);
            }
        }
        
        return $text;
    } catch (Exception $e) {
        error_log("Error extracting text from PDF: " . $e->getMessage());
        return "";
    }
}

function extract_json_from_response($text) {
    // Regex to find JSON wrapped in markdown or just the JSON itself
    if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $text, $match)) {
        $json_str = $match[1];
        $decoded = json_decode($json_str, true);
        if ($decoded !== null) {
            return $decoded;
        }
    }
    
    // Try to find JSON object
    if (preg_match('/\{[\s\S]*\}/', $text, $match)) {
        $decoded = json_decode($match[0], true);
        if ($decoded !== null) {
            return $decoded;
        }
    }
    
    // Try to find JSON array
    if (preg_match('/\[[\s\S]*\]/', $text, $match)) {
        $decoded = json_decode($match[0], true);
        if ($decoded !== null) {
            return $decoded;
        }
    }
    
    error_log("DEBUG: No valid JSON found in response.");
    return null;
}

function generate_content_with_groq($prompt) {
    $system_prompt = "You are a helpful assistant that strictly follows instructions. You MUST return JSON objects as requested by the user. Do not add any explanatory text, apologies, or markdown formatting before or after the JSON object. Just return the raw JSON object and nothing else.";
    
    $data = [
        'model' => GROQ_MODEL,
        'messages' => [
            ['role' => 'system', 'content' => $system_prompt],
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 4096,
        'top_p' => 1,
        'stream' => false
    ];
    
    $json_payload = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    
    if ($json_payload === false) {
        error_log("DEBUG: Failed to encode JSON: " . json_last_error_msg());
        return null;
    }
    
    error_log("DEBUG: Sending prompt to Groq with model " . GROQ_MODEL);
    error_log("DEBUG: JSON payload length: " . strlen($json_payload));
    
    $ch = curl_init(GROQ_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY,
        'Content-Length: ' . strlen($json_payload)
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($curl_error) {
        error_log("DEBUG: cURL Error: " . $curl_error);
        return null;
    }
    
    if ($http_code !== 200) {
        error_log("DEBUG: Groq API Error (HTTP $http_code): " . $response);
        return null;
    }
    
    $result = json_decode($response, true);
    if (isset($result['choices'][0]['message']['content'])) {
        $content = $result['choices'][0]['message']['content'];
        error_log("DEBUG: Raw Groq response: " . $content);
        
        $json_data = extract_json_from_response($content);
        if ($json_data) {
            return json_encode($json_data);
        } else {
            error_log("DEBUG: Failed to extract JSON from Groq response.");
            return null;
        }
    }
    
    error_log("DEBUG: Groq response was empty or malformed.");
    return null;
}

// === API Endpoints ===

function upload_resume() {
    // Use Python backend - it works perfectly
    $session_id = $_SERVER['HTTP_X_USER_SESSION_ID'] ?? uniqid('session_', true);
    
    if (!isset($_FILES['resume'])) {
        echo json_encode(['error' => 'No resume file provided']);
        http_response_code(400);
        return;
    }
    
    $file = $_FILES['resume'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => 'No selected file']);
        http_response_code(400);
        return;
    }
    
    // Forward to Python backend
    $ch = curl_init('http://127.0.0.1:5000/upload_resume');
    $cfile = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['resume' => $cfile]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-User-Session-Id: ' . $session_id]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $result = json_decode($response, true);
        if ($result && isset($result['candidate_profile'])) {
            // Store in PHP session
            get_or_create_session($session_id);
            $_SESSION['sessions'][$session_id]['candidate_profile'] = $result['candidate_profile'];
            echo json_encode([
                'message' => 'Resume processed successfully',
                'candidate_profile' => $result['candidate_profile'],
                'session_id' => $session_id
            ]);
            http_response_code(200);
        } else {
            echo json_encode(['error' => 'Invalid response from processing service']);
            http_response_code(500);
        }
    } else {
        echo json_encode(['error' => 'Failed to process resume']);
        http_response_code(500);
    }
}

function setup_interview() {
    // Forward to Python backend
    $session_id = $_SERVER['HTTP_X_USER_SESSION_ID'] ?? null;
    if (!$session_id) {
        echo json_encode(['error' => 'Invalid or missing session ID']);
        http_response_code(400);
        return;
    }
    
    $input = file_get_contents('php://input');
    
    $ch = curl_init('http://127.0.0.1:5000/setup_interview');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-User-Session-Id: ' . $session_id
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $result = json_decode($response, true);
        if ($result && isset($result['questions'])) {
            // Store in PHP session
            $_SESSION['sessions'][$session_id]['interview_questions'] = $result['questions'];
            $_SESSION['sessions'][$session_id]['interview_responses'] = [];
            $_SESSION['sessions'][$session_id]['interview_start_time'] = date('c');
        }
    }
    
    echo $response;
    http_response_code($http_code);
}

function submit_answer() {
    // Forward to Python backend
    $session_id = $_SERVER['HTTP_X_USER_SESSION_ID'] ?? null;
    if (!$session_id) {
        echo json_encode(['error' => 'Invalid or missing session ID']);
        http_response_code(400);
        return;
    }
    
    $input = file_get_contents('php://input');
    
    $ch = curl_init('http://127.0.0.1:5000/submit_answer');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-User-Session-Id: ' . $session_id
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo $response;
    http_response_code($http_code);
}

function get_assessment() {
    // Forward to Python backend
    $session_id = $_SERVER['HTTP_X_USER_SESSION_ID'] ?? null;
    if (!$session_id) {
        echo json_encode(['error' => 'Invalid or missing session ID']);
        http_response_code(400);
        return;
    }
    
    $ch = curl_init('http://127.0.0.1:5000/get_assessment');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-User-Session-Id: ' . $session_id
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($curl_error) {
        error_log("DEBUG: cURL Error in get_assessment: " . $curl_error);
        echo json_encode(['error' => 'Failed to connect to backend service']);
        http_response_code(500);
        return;
    }
    
    echo $response;
    http_response_code($http_code);
}


function log_security() {
    // Log security events
    $session_id = $_SERVER['HTTP_X_USER_SESSION_ID'] ?? null;
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    error_log("SECURITY EVENT: " . json_encode($data));
    
    // Forward to Python backend if available
    if ($session_id) {
        $ch = curl_init('http://127.0.0.1:5000/log_security');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-User-Session-Id: ' . $session_id
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Don't wait too long
        
        curl_exec($ch);
        curl_close($ch);
    }
    
    echo json_encode(['message' => 'Security event logged']);
    http_response_code(200);
}
