<?php

// Afficher toutes les informations PHP
phpinfo();

// Tester l'écriture de logs
$logFile = __DIR__ . '/../storage/logs/phpinfo_test.log';
$message = date('Y-m-d H:i:s') . " - Test d'écriture de logs depuis phpinfo.php\n";

try {
    file_put_contents($logFile, $message, FILE_APPEND);
    echo '<div style="background: green; color: white; padding: 10px; margin-top: 20px;">
        Test d\'écriture de logs réussi : ' . $logFile . '
    </div>';
} catch (Exception $e) {
    echo '<div style="background: red; color: white; padding: 10px; margin-top: 20px;">
        Erreur d\'écriture : ' . $e->getMessage() . '
    </div>';
} 