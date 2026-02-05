<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$host = 'localhost';
$dbname = 'your_database_name';
$username = 'your_db_username';
$password = 'your_db_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

// Get POST data
$project_id = $_POST['project_id'] ?? null;
$panel_type = $_POST['panel_type'] ?? null;
$uploaded_by = $_POST['uploaded_by'] ?? null;

if (!$project_id || !$panel_type || !isset($_FILES['report'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields or file']);
    exit();
}

$file = $_FILES['report'];

// Validate file
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'File upload error']);
    exit();
}

// Allowed file types
$allowed_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
$file_type = mime_content_type($file['tmp_name']);

if (!in_array($file_type, $allowed_types)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX allowed']);
    exit();
}

// Create uploads directory if not exists
$upload_dir = __DIR__ . '/../../public/uploads/reports/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Generate unique filename
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = $project_id . '_' . $panel_type . '_' . time() . '.' . $file_extension;
$file_path = $upload_dir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $file_path)) {
    echo json_encode(['success' => false, 'message' => 'Failed to save file']);
    exit();
}

try {
    // Create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS panel_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id VARCHAR(255) NOT NULL,
            panel_type VARCHAR(100) NOT NULL,
            filename VARCHAR(500) NOT NULL,
            original_filename VARCHAR(500) NOT NULL,
            file_path VARCHAR(1000) NOT NULL,
            uploaded_by VARCHAR(255),
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_project_panel (project_id, panel_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Insert report record
    $stmt = $pdo->prepare("
        INSERT INTO panel_reports 
        (project_id, panel_type, filename, original_filename, file_path, uploaded_by)
        VALUES (:project_id, :panel_type, :filename, :original_filename, :file_path, :uploaded_by)
    ");

    $stmt->execute([
        ':project_id' => $project_id,
        ':panel_type' => $panel_type,
        ':filename' => $filename,
        ':original_filename' => $file['name'],
        ':file_path' => '/uploads/reports/' . $filename,
        ':uploaded_by' => $uploaded_by
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Report uploaded successfully',
        'filename' => $filename,
        'file_path' => '/uploads/reports/' . $filename
    ]);

} catch (PDOException $e) {
    // Delete uploaded file if database insert fails
    if (file_exists($file_path)) {
        unlink($file_path);
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
