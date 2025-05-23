<?php

// Script de test pour vérifier la journalisation des activations

// Initialiser le tableau des résultats
$results = [];

// Test 1: Vérifier si le dossier storage/logs existe
$logsDir = __DIR__ . '/../storage/logs';
$results['logs_dir_exists'] = is_dir($logsDir);
$results['logs_dir_path'] = $logsDir;

// Test 2: Vérifier les permissions du dossier
$results['logs_dir_writable'] = is_writable($logsDir);
$results['logs_dir_permissions'] = substr(sprintf('%o', fileperms($logsDir)), -4);

// Test 3: Créer un fichier de log test
$testLogFile = $logsDir . '/test_' . date('Ymd_His') . '.log';
$logContent = date('Y-m-d H:i:s') . " - Test d'écriture de log\n";
$results['write_test_file'] = @file_put_contents($testLogFile, $logContent);
$results['test_file_path'] = $testLogFile;
$results['test_file_exists'] = file_exists($testLogFile);

// Test 4: Vérifier si le fichier activations.log existe
$activationsLog = $logsDir . '/activations.log';
$results['activations_log_exists'] = file_exists($activationsLog);
if ($results['activations_log_exists']) {
    $results['activations_log_size'] = filesize($activationsLog);
    $results['activations_log_permissions'] = substr(sprintf('%o', fileperms($activationsLog)), -4);
}

// Test 5: Essayer d'écrire dans activations.log
$activationLogContent = date('Y-m-d H:i:s') . " - Test d'écriture via test_activation_logs.php\n";
$results['write_activations_log'] = @file_put_contents($activationsLog, $activationLogContent, FILE_APPEND);

// Test 6: Vérifier error_log
error_log("Test depuis test_activation_logs.php");
$results['error_log_called'] = true;

// Test 7: Vérifier le chemin d'error_log
$results['error_log_path'] = ini_get('error_log');
$results['error_log_enabled'] = ini_get('log_errors');

// Afficher les résultats
echo "<html>
<head>
    <title>Test de journalisation des activations</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Test de journalisation des activations</h1>
    <p>Date et heure du test: " . date('Y-m-d H:i:s') . "</p>
    
    <table>
        <tr>
            <th>Test</th>
            <th>Résultat</th>
            <th>Détails</th>
        </tr>";

foreach ($results as $test => $result) {
    $status = (is_bool($result) && $result) || (!is_bool($result) && !empty($result)) 
        ? '<span class="success">SUCCÈS</span>' 
        : '<span class="error">ÉCHEC</span>';
    
    $details = is_bool($result) 
        ? ($result ? 'true' : 'false') 
        : (is_array($result) ? json_encode($result) : $result);
    
    echo "<tr>
        <td>{$test}</td>
        <td>{$status}</td>
        <td>{$details}</td>
    </tr>";
}

echo "</table>

    <h2>Recommandations</h2>
    <ul>";

if (!$results['logs_dir_exists']) {
    echo "<li class='error'>Le dossier storage/logs n'existe pas. Créez-le avec les permissions appropriées.</li>";
} elseif (!$results['logs_dir_writable']) {
    echo "<li class='error'>Le dossier storage/logs n'est pas accessible en écriture. Modifiez les permissions.</li>";
}

if (!$results['write_test_file']) {
    echo "<li class='error'>Impossible d'écrire dans le dossier storage/logs. Vérifiez les permissions du serveur web.</li>";
}

if ($results['write_activations_log'] === false) {
    echo "<li class='error'>Impossible d'écrire dans le fichier activations.log. Vérifiez les permissions.</li>";
}

echo "</ul>
</body>
</html>"; 