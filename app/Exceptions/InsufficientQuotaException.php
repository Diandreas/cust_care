<?php

namespace App\Exceptions;

use Exception;

class InsufficientQuotaException extends Exception
{
    /**
     * Créer une nouvelle instance d'exception de quota insuffisant.
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     * @return void
     */
    public function __construct(string $message = "Quota insuffisant", int $code = 0, \Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
} 