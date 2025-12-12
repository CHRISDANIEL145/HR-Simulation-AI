<?php
/**
 * Universal Document Parser
 * Supports: PDF, DOCX, DOC, TXT, RTF, ODT
 * Uses multiple extraction methods for maximum compatibility
 */

class DocumentParser {
    
    /**
     * Extract text from any document format
     */
    public static function extractText($filePath, $mimeType) {
        $text = '';
        
        // Detect file type
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        switch ($extension) {
            case 'pdf':
                $text = self::extractFromPDF($filePath);
                break;
            case 'docx':
                $text = self::extractFromDOCX($filePath);
                break;
            case 'doc':
                $text = self::extractFromDOC($filePath);
                break;
            case 'txt':
                $text = file_get_contents($filePath);
                break;
            case 'rtf':
                $text = self::extractFromRTF($filePath);
                break;
            case 'odt':
                $text = self::extractFromODT($filePath);
                break;
            default:
                // Try to read as plain text
                $text = file_get_contents($filePath);
        }
        
        return self::cleanText($text);
    }
    
    /**
     * Extract from PDF - Multiple methods
     */
    private static function extractFromPDF($filePath) {
        $text = '';
        
        // Method 1: pdftotext command (best quality)
        if (self::commandExists('pdftotext')) {
            $output = shell_exec('pdftotext ' . escapeshellarg($filePath) . ' -');
            if (!empty($output)) {
                return $output;
            }
        }
        
        // Method 2: Python PyPDF2 via command
        if (self::commandExists('python')) {
            $pythonScript = <<<PYTHON
import sys
from PyPDF2 import PdfReader
try:
    reader = PdfReader(sys.argv[1])
    text = ''
    for page in reader.pages:
        text += page.extract_text() or ''
    print(text)
except:
    pass
PYTHON;
            $tempScript = tempnam(sys_get_temp_dir(), 'pdf_') . '.py';
            file_put_contents($tempScript, $pythonScript);
            $output = shell_exec('python ' . escapeshellarg($tempScript) . ' ' . escapeshellarg($filePath));
            unlink($tempScript);
            if (!empty($output)) {
                return $output;
            }
        }
        
        // Method 3: Raw PDF parsing (fallback)
        $content = file_get_contents($filePath);
        
        // Extract text between parentheses
        if (preg_match_all('/\((.*?)\)/s', $content, $matches)) {
            $text .= implode(' ', $matches[1]);
        }
        
        // Extract from text streams
        if (preg_match_all('/stream\s+(.*?)\s+endstream/s', $content, $matches)) {
            foreach ($matches[1] as $stream) {
                $decoded = @gzuncompress($stream);
                if ($decoded) {
                    $text .= ' ' . $decoded;
                }
            }
        }
        
        return $text;
    }
    
    /**
     * Extract from DOCX
     */
    private static function extractFromDOCX($filePath) {
        $text = '';
        
        // DOCX is a ZIP file
        $zip = new ZipArchive();
        if ($zip->open($filePath) === TRUE) {
            // Read document.xml
            $xml = $zip->getFromName('word/document.xml');
            if ($xml) {
                $dom = new DOMDocument();
                $dom->loadXML($xml);
                $text = $dom->textContent;
            }
            $zip->close();
        }
        
        return $text;
    }
    
    /**
     * Extract from DOC (old format)
     */
    private static function extractFromDOC($filePath) {
        // Try antiword command
        if (self::commandExists('antiword')) {
            $output = shell_exec('antiword ' . escapeshellarg($filePath));
            if (!empty($output)) {
                return $output;
            }
        }
        
        // Fallback: basic extraction
        $content = file_get_contents($filePath);
        $text = preg_replace('/[^\x20-\x7E\n\r\t]/', ' ', $content);
        return $text;
    }
    
    /**
     * Extract from RTF
     */
    private static function extractFromRTF($filePath) {
        $content = file_get_contents($filePath);
        
        // Remove RTF control words
        $text = preg_replace('/\\\[a-z]+\d*\s?/', '', $content);
        $text = preg_replace('/[{}]/', '', $text);
        
        return $text;
    }
    
    /**
     * Extract from ODT
     */
    private static function extractFromODT($filePath) {
        $text = '';
        
        $zip = new ZipArchive();
        if ($zip->open($filePath) === TRUE) {
            $xml = $zip->getFromName('content.xml');
            if ($xml) {
                $dom = new DOMDocument();
                $dom->loadXML($xml);
                $text = $dom->textContent;
            }
            $zip->close();
        }
        
        return $text;
    }
    
    /**
     * Clean extracted text
     */
    private static function cleanText($text) {
        // Remove null bytes
        $text = str_replace("\0", '', $text);
        
        // Normalize whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Remove control characters except newlines and tabs
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        
        return trim($text);
    }
    
    /**
     * Check if command exists
     */
    private static function commandExists($command) {
        $windows = strpos(PHP_OS, 'WIN') === 0;
        $test = $windows ? 'where' : 'which';
        return !empty(shell_exec("$test $command 2>&1"));
    }
}
