<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function templates()
    {
        return $this->hasMany(Template::class);
    }

    public function automaticEvents()
    {
        return $this->hasMany(AutomaticEvent::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latest();
    }
}
