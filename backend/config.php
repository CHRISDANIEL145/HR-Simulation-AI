<?php
// Load environment variables from .env file
function loadEnv($path = '.env') {
    if (!file_exists($path)) {
        throw new Exception('.env file not found');
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            $value = trim($value, '"\'');
            
            if (!array_key_exists($name, $_ENV)) {
                $_ENV[$name] = $value;
            }
        }
    }
}

loadEnv(__DIR__ . '/.env');

// Configuration
define('GROQ_API_KEY', $_ENV['GROQ_API_KEY'] ?? '');
define('GROQ_MODEL', 'llama-3.3-70b-versatile');
define('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions');

if (empty(GROQ_API_KEY) || strpos(GROQ_API_KEY, 'gsk_') === false) {
    throw new Exception('GROQ_API_KEY is not set or invalid. Please add it to your .env file.');
}
