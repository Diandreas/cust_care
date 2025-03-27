<?php

namespace App\Http\Requests\Campaign;

use Illuminate\Foundation\Http\FormRequest;

class StoreCampaignRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Autorisation peut être gérée au niveau de la route
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'message_content' => 'required|string|max:612',
            'scheduled_at' => 'nullable|date|after:now',
            'client_ids' => 'required_without:filter_criteria|array',
            'client_ids.*' => 'exists:clients,id',
            'filter_criteria' => 'required_without:client_ids|array',
            'filter_criteria.tags' => 'nullable|array',
            'filter_criteria.tags.*' => 'exists:tags,id',
            'filter_criteria.categories' => 'nullable|array',
            'filter_criteria.categories.*' => 'exists:categories,id',
            'send_now' => 'boolean'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la campagne est obligatoire',
            'message_content.required' => 'Le contenu du message est obligatoire',
            'message_content.max' => 'Le contenu du message ne doit pas dépasser 612 caractères (4 SMS)',
            'scheduled_at.after' => 'La date d\'envoi doit être ultérieure à maintenant',
            'client_ids.required_without' => 'Vous devez sélectionner des clients ou définir des critères de filtre',
            'filter_criteria.required_without' => 'Vous devez sélectionner des clients ou définir des critères de filtre',
            'client_ids.*.exists' => 'Un des clients sélectionnés n\'existe pas',
            'filter_criteria.tags.*.exists' => 'Un des tags sélectionnés n\'existe pas',
            'filter_criteria.categories.*.exists' => 'Une des catégories sélectionnées n\'existe pas',
        ];
    }
} 