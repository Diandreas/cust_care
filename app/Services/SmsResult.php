<?php

namespace App\Services;

class SmsResult
{
    protected $success;
    protected $messageId;
    protected $error;

    public function __construct(bool $success, ?string $messageId = null, ?string $error = null)
    {
        $this->success = $success;
        $this->messageId = $messageId;
        $this->error = $error;
    }

    public function isSuccess(): bool
    {
        return $this->success;
    }

    public function getMessageId(): ?string
    {
        return $this->messageId;
    }

    public function getError(): ?string
    {
        return $this->error;
    }
}
