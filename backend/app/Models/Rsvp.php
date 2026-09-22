<?php

namespace App\Models;

use Database\Factories\RsvpFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rsvp extends Model
{
    /** @use HasFactory<RsvpFactory> */
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'guest_name',
        'choice',
        'guest_count',
        'meal_preference',
        'note',
        'edit_token',
    ];

    /**
     * Only ever returned to the guest's own browser by the public RSVP
     * endpoint — never in admin listings or exports.
     *
     * @var list<string>
     */
    protected $hidden = ['edit_token'];

    protected function casts(): array
    {
        return [
            'guest_count' => 'integer',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
