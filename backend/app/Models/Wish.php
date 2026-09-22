<?php

namespace App\Models;

use App\Observers\InvitationCacheObserver;
use Database\Factories\WishFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(InvitationCacheObserver::class)]
class Wish extends Model
{
    /** @use HasFactory<WishFactory> */
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'name',
        'message',
    ];

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
