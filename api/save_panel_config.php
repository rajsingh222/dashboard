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
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Get POST data
$project_id = $_POST['project_id'] ?? null;
$panel_type = $_POST['panel_type'] ?? null;
$config = $_POST['config'] ?? null;

if (!$project_id || !$panel_type || !$config) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

// Decode JSON config
$config_data = json_decode($config, true);
if (!$config_data) {
    echo json_encode(['success' => false, 'message' => 'Invalid configuration data']);
    exit();
}

try {
    // Create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS panel_configurations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id VARCHAR(255) NOT NULL,
            panel_type VARCHAR(100) NOT NULL,
            title VARCHAR(500),
            description TEXT,
            parameters TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_project_panel (project_id, panel_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Insert or update configuration
    $stmt = $pdo->prepare("
        INSERT INTO panel_configurations 
        (project_id, panel_type, title, description, parameters, notes)
        VALUES (:project_id, :panel_type, :title, :description, :parameters, :notes)
        ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        parameters = VALUES(parameters),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':project_id' => $project_id,
        ':panel_type' => $panel_type,
        ':title' => $config_data['title'] ?? '',
        ':description' => $config_data['description'] ?? '',
        ':parameters' => $config_data['parameters'] ?? '',
        ':notes' => $config_data['notes'] ?? ''
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Configuration saved successfully'
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
