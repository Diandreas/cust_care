<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'company_name',
        'timezone',
        'subscription_plan',
        'google_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'settings' => 'array',
    ];

    /**
     * Get the clients associated with the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    /**
     * Get the categories associated with the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Get the tags associated with the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Get the messages associated with the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the subscription associated with the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function templates()
    {
        return $this->hasMany(Template::class);
    }

    public function automaticEvents()
    {
        return $this->hasMany(AutomaticEvent::class);
    }


/**
 * Get all user transactions.
 */
public function transactions()
{
    return $this->hasMany(Transaction::class);
}

/**
 * Obtenir les configurations d'événements de l'utilisateur
 */
public function eventConfigs()
{
    return $this->hasMany(UserEventConfig::class);
}

/**
 * Route pour les notifications Twilio
 *
 * @param  \Illuminate\Notifications\Notification  $notification
 * @return string
 */
public function routeNotificationForTwilio($notification)
{
    return $this->phone_number;
}

    public function twilioNumbers()
    {
        return $this->hasMany(TwilioNumber::class);
    }

    /**
     * Obtenir le plan d'abonnement depuis la relation subscription ou l'attribut direct
     */
    public function getSubscriptionPlanAttribute()
    {
        // Si vous utilisez le modèle Subscription
        if ($this->subscription) {
            return $this->subscription->plan;
        }

        // Sinon utiliser l'attribut direct sur User
        return $this->attributes['subscription_plan'] ?? 'starter';
    }

    /**
     * Vérifier si l'utilisateur peut envoyer des SMS
     */
    public function canSendSms($count = 1): bool
    {
        $quotas = config('services.twilio.quotas');
        $planQuota = $quotas[$this->subscription_plan]['sms_per_month'] ?? 0;

        $currentUsage = $this->messages()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return ($currentUsage + $count) <= $planQuota;
    }

}
