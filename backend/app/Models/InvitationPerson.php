<?php

namespace App\Models;

use App\Observers\InvitationCacheObserver;
use Database\Factories\InvitationPersonFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(InvitationCacheObserver::class)]
class InvitationPerson extends Model
{
    /** @use HasFactory<InvitationPersonFactory> */
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
