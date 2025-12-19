<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'status' => 'ok',
    'message' => 'Debug endpoint working',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'laravel_public_path' => __DIR__,
]);



