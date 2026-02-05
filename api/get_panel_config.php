<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$project_id = $_GET['project_id'] ?? null;

if (!$project_id) {
    echo json_encode(['success' => false, 'message' => 'Project ID is required']);
    exit();
}

try {
    // Fetch all panel configurations for this project
    $stmt = $pdo->prepare("
        SELECT panel_type, title, description, parameters, notes, updated_at
        FROM panel_configurations
        WHERE project_id = :project_id
    ");
    
    $stmt->execute([':project_id' => $project_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [
        'success' => true,
        'designProof' => null,
        'loadTesting' => null,
        'nde' => null
    ];

    foreach ($results as $row) {
        $config = [
            'title' => $row['title'],
            'description' => $row['description'],
            'parameters' => $row['parameters'],
            'notes' => $row['notes'],
            'applyToOthers' => false
        ];

        switch ($row['panel_type']) {
            case 'designProof':
                $response['designProof'] = $config;
                break;
            case 'loadTesting':
                $response['loadTesting'] = $config;
                break;
            case 'nde':
                $response['nde'] = $config;
                break;
        }
    }

    echo json_encode($response);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
