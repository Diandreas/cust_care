<?php

// Simple script pour tester les fonctionnalités de base et les permissions de PHP

echo "===== Test PHP Debugging =====" . PHP_EOL;

// Version de PHP
echo "PHP Version: " . phpversion() . PHP_EOL;

// Vérifier si error_log fonctionne
error_log("Test error_log from debug_php.php");
echo "error_log test exécuté" . PHP_EOL;

// Vérifier le répertoire courant
echo "Répertoire courant: " . getcwd() . PHP_EOL;

// Tester l'écriture dans un fichier
$testFile = __DIR__ . '/debug_test.log';
try {
    file_put_contents($testFile, date('Y-m-d H:i:s') . " - Test d'écriture dans un fichier\n");
    echo "Test d'écriture réussi: " . $testFile . PHP_EOL;
    
    // Vérifier si le fichier a été créé
    if (file_exists($testFile)) {
        echo "Le fichier existe après l'écriture" . PHP_EOL;
    } else {
        echo "ERREUR: Le fichier n'existe pas après tentative d'écriture" . PHP_EOL;
    }
} catch (Exception $e) {
    echo "ERREUR lors de l'écriture du fichier: " . $e->getMessage() . PHP_EOL;
}

// Vérifier les permissions du dossier storage/logs
$logsDir = __DIR__ . '/storage/logs';
echo "Dossier logs: " . $logsDir . PHP_EOL;

if (is_dir($logsDir)) {
    echo "Le dossier logs existe" . PHP_EOL;
    
    // Vérifier si on peut écrire dans le dossier
    if (is_writable($logsDir)) {
        echo "Le dossier logs est accessible en écriture" . PHP_EOL;
        
        // Tester l'écriture dans un fichier dans storage/logs
        $logFile = $logsDir . '/debug_test.log';
        try {
            file_put_contents($logFile, date('Y-m-d H:i:s') . " - Test d'écriture dans storage/logs\n");
            echo "Test d'écriture dans logs réussi: " . $logFile . PHP_EOL;
        } catch (Exception $e) {
            echo "ERREUR lors de l'écriture dans logs: " . $e->getMessage() . PHP_EOL;
        }
    } else {
        echo "ERREUR: Le dossier logs n'est PAS accessible en écriture" . PHP_EOL;
    }
} else {
    echo "ERREUR: Le dossier logs n'existe pas" . PHP_EOL;
    
    // Tenter de créer le dossier
    try {
        mkdir($logsDir, 0777, true);
        echo "Dossier logs créé avec succès" . PHP_EOL;
    } catch (Exception $e) {
        echo "ERREUR lors de la création du dossier logs: " . $e->getMessage() . PHP_EOL;
    }
}

// Vérifier les configurations PHP importantes
echo "===== Configuration PHP =====" . PHP_EOL;
echo "display_errors: " . ini_get('display_errors') . PHP_EOL;
echo "error_reporting: " . ini_get('error_reporting') . PHP_EOL;
echo "log_errors: " . ini_get('log_errors') . PHP_EOL;
echo "error_log: " . ini_get('error_log') . PHP_EOL;
echo "open_basedir: " . ini_get('open_basedir') . PHP_EOL;
echo "memory_limit: " . ini_get('memory_limit') . PHP_EOL;

echo "===== Fin des tests =====" . PHP_EOL; 