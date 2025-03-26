<?php

return [
    'tasks' => [
        [
            'command' => 'campaigns:send-scheduled',
            'schedule' => 'everyMinute',
            'options' => ['withoutOverlapping', 'runInBackground']
        ],
        // Ajoutez d'autres tâches ici
    ]
];
