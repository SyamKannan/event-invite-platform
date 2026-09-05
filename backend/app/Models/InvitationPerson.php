<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationPerson extends Model
{
    /** @use HasFactory<\Database\Factories\InvitationPersonFactory> */
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'role',
        'first_name',
        'parents_text',
        'photo',
    ];

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
