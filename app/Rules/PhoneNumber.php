<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class PhoneNumber implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        // Validation basique des formats E.164
        return preg_match('/^\+[1-9]\d{1,14}$/', $value) ||
               // Format local (configurable selon les besoins)
               preg_match('/^6\d{8}$/', $value) ||
               // Format avec indicatif pays séparé
               preg_match('/^(00|\+)[1-9]{1,3}[- ]?[1-9]\d{1,14}$/', $value);
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "Le numéro de téléphone n'est pas dans un format valide.";
    }
} 