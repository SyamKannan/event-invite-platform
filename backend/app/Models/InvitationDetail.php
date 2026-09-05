<?php

namespace App\Models;

use Database\Factories\InvitationDetailFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationDetail extends Model
{
    /** @use HasFactory<InvitationDetailFactory> */
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'event_date',
        'display_date',
        'display_time',
        'display_location',
        'hero_image',
        'hero_overline',
        'hero_tagline',
        'envelope_overline',
        'envelope_cta',
        'envelope_animation',
        'music_enabled',
        'music_src',
        'contact_phone_primary',
        'contact_phone_secondary',
        'contact_email',
        'contact_instagram',
        'floating_decor_enabled',
        'floating_decor_count',
        'connector',
        'show_bride',
        'show_groom',
        'celebrant_age',
        'celebrant_turning_text',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'music_enabled' => 'boolean',
            'floating_decor_enabled' => 'boolean',
            'show_bride' => 'boolean',
            'show_groom' => 'boolean',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
