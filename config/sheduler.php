<?php

return [
    'tasks' => [
        [
            'command' => 'campaigns:send-scheduled',
            'schedule' => 'everyMinute',
            'options' => ['withoutOverlapping', 'runInBackground']
        ],
        [
            'command' => 'events:process-daily',
            'schedule' => 'daily',
            'options' => ['withoutOverlapping', 'runInBackground']
        ],
        // Ajoutez d'autres tâches ici
    ]
];
