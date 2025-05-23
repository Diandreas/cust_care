<?php

// Script pour vérifier et corriger les problèmes de permissions dans le dossier storage/logs

$basePath = __DIR__ . '/../';
$storagePath = $basePath . 'storage';
$logsPath = $storagePath . '/logs';
$activationsLog = $logsPath . '/activations.log';

echo "<html><head><title>Vérification du stockage</title>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    .container { max-width: 800px; margin: 0 auto; }
    .action { background-color: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 5px solid #333; }
</style>";
echo "</head><body><div class='container'>";
echo "<h1>Vérification et réparation du stockage</h1>";

// 1. Vérifier si le dossier storage existe
echo "<h2>Dossier storage</h2>";
if (is_dir($storagePath)) {
    echo "<p class='success'>✓ Le dossier storage existe</p>";
    
    // Vérifier les permissions
    if (is_writable($storagePath)) {
        echo "<p class='success'>✓ Le dossier storage est accessible en écriture</p>";
    } else {
        echo "<p class='error'>✗ Le dossier storage n'est PAS accessible en écriture</p>";
        
        // Tenter de corriger
        echo "<div class='action'>Tentative de correction des permissions...</div>";
        if (@chmod($storagePath, 0777)) {
            echo "<p class='success'>✓ Permissions corrigées pour storage</p>";
        } else {
            echo "<p class='error'>✗ Impossible de corriger les permissions pour storage</p>";
        }
    }
} else {
    echo "<p class='error'>✗ Le dossier storage n'existe pas !</p>";
    
    // Tenter de créer
    echo "<div class='action'>Tentative de création du dossier storage...</div>";
    if (@mkdir($storagePath, 0777, true)) {
        echo "<p class='success'>✓ Dossier storage créé avec succès</p>";
    } else {
        echo "<p class='error'>✗ Impossible de créer le dossier storage</p>";
    }
}

// 2. Vérifier si le dossier logs existe
echo "<h2>Dossier logs</h2>";
if (is_dir($logsPath)) {
    echo "<p class='success'>✓ Le dossier logs existe</p>";
    
    // Vérifier les permissions
    if (is_writable($logsPath)) {
        echo "<p class='success'>✓ Le dossier logs est accessible en écriture</p>";
    } else {
        echo "<p class='error'>✗ Le dossier logs n'est PAS accessible en écriture</p>";
        
        // Tenter de corriger
        echo "<div class='action'>Tentative de correction des permissions...</div>";
        if (@chmod($logsPath, 0777)) {
            echo "<p class='success'>✓ Permissions corrigées pour logs</p>";
        } else {
            echo "<p class='error'>✗ Impossible de corriger les permissions pour logs</p>";
        }
    }
} else {
    echo "<p class='error'>✗ Le dossier logs n'existe pas !</p>";
    
    // Tenter de créer
    echo "<div class='action'>Tentative de création du dossier logs...</div>";
    if (@mkdir($logsPath, 0777, true)) {
        echo "<p class='success'>✓ Dossier logs créé avec succès</p>";
    } else {
        echo "<p class='error'>✗ Impossible de créer le dossier logs</p>";
    }
}

// 3. Vérifier si le fichier activations.log existe
echo "<h2>Fichier activations.log</h2>";
if (file_exists($activationsLog)) {
    echo "<p class='success'>✓ Le fichier activations.log existe</p>";
    
    // Vérifier les permissions
    if (is_writable($activationsLog)) {
        echo "<p class='success'>✓ Le fichier activations.log est accessible en écriture</p>";
    } else {
        echo "<p class='error'>✗ Le fichier activations.log n'est PAS accessible en écriture</p>";
        
        // Tenter de corriger
        echo "<div class='action'>Tentative de correction des permissions...</div>";
        if (@chmod($activationsLog, 0666)) {
            echo "<p class='success'>✓ Permissions corrigées pour activations.log</p>";
        } else {
            echo "<p class='error'>✗ Impossible de corriger les permissions pour activations.log</p>";
        }
    }
} else {
    echo "<p class='warning'>⚠ Le fichier activations.log n'existe pas encore</p>";
    
    // Tenter de créer
    echo "<div class='action'>Tentative de création du fichier activations.log...</div>";
    if (@file_put_contents($activationsLog, "# Journal des activations de forfaits\n")) {
        echo "<p class='success'>✓ Fichier activations.log créé avec succès</p>";
    } else {
        echo "<p class='error'>✗ Impossible de créer le fichier activations.log</p>";
    }
}

// 4. Tester l'écriture
echo "<h2>Test d'écriture</h2>";
$testFile = $logsPath . '/test_write.log';
$testContent = date('Y-m-d H:i:s') . " - Test d'écriture dans le dossier logs\n";

echo "<div class='action'>Tentative d'écriture dans le dossier logs...</div>";
if (@file_put_contents($testFile, $testContent)) {
    echo "<p class='success'>✓ Test d'écriture réussi</p>";
} else {
    echo "<p class='error'>✗ Test d'écriture échoué</p>";
}

echo "<h2>Conclusion</h2>";
echo "<p>Les vérifications et corrections sont terminées. Si des problèmes persistent, veuillez contacter votre administrateur système pour vérifier les permissions des dossiers sur le serveur.</p>";

echo "<p>Pour activer un forfait, vous pouvez maintenant utiliser les URL suivantes :</p>";
echo "<ul>";
echo "<li><a href='/payment/direct-activation/1/monthly'>Activer forfait ID 1 (mensuel)</a></li>";
echo "<li><a href='/payment/direct-activation/2/monthly'>Activer forfait ID 2 (mensuel)</a></li>";
echo "<li><a href='/payment/direct-activation/3/monthly'>Activer forfait ID 3 (mensuel)</a></li>";
echo "<li><a href='/payment/direct-activation/1/annual'>Activer forfait ID 1 (annuel)</a></li>";
echo "</ul>";

echo "</div></body></html>"; 