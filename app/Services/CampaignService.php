<?php

namespace App\Services;

use SendGrid\Mail\Mail;
use SendGrid;
use App\Services\TwilioService;

class CampaignService
{
    protected $twilioService;
    
    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }
    
    /**
     * Envoyer une campagne par email via SendGrid
     * 
     * @param array $campaign Les données de la campagne
     * @param array $recipients Liste des destinataires
     * @return \SendGrid\Response
     */
    public function sendEmailCampaign($campaign, $recipients)
    {
        $email = new Mail();
        $email->setFrom($campaign['from_email'], $campaign['from_name']);
        $email->setSubject($campaign['subject']);
        
        // Pour utiliser un template SendGrid
        if (isset($campaign['template_id']) && $campaign['template_id']) {
            $email->setTemplateId($campaign['template_id']);
        } else {
            $email->addContent("text/html", $campaign['content']);
        }
        
        foreach ($recipients as $recipient) {
            $email->addTo($recipient['email'], $recipient['name']);
            // Personnalisation dynamique pour templates
            if (isset($campaign['template_id']) && $campaign['template_id']) {
                $email->addDynamicTemplateData("first_name", $recipient['first_name']);
                $email->addDynamicTemplateData("name", $recipient['name']);
            }
        }
        
        $sendgrid = new SendGrid(config('services.sendgrid.key'));
        return $sendgrid->send($email);
    }
    
    /**
     * Envoyer une campagne par SMS via Twilio
     * 
     * @param array $campaign Les données de la campagne
     * @param array $recipients Liste des destinataires
     * @return array Résultats des envois
     */
    public function sendSMSCampaign($campaign, $recipients)
    {
        $results = [];
        
        foreach ($recipients as $recipient) {
            // Remplacer les variables dynamiques dans le message
            $message = str_replace(
                ['{name}', '{first_name}'],
                [$recipient['name'], $recipient['first_name']],
                $campaign['content']
            );
            
            // Envoyer le SMS
            $result = $this->twilioService->sendSMS($recipient['phone_number'], $message);
            $results[] = [
                'recipient' => $recipient['phone_number'],
                'status' => $result->status,
                'sid' => $result->sid
            ];
        }
        
        return $results;
    }
    
  
   
} 