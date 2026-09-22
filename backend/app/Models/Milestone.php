<?php

namespace App\Models;

use App\Observers\InvitationCacheObserver;
use Database\Factories\MilestoneFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(InvitationCacheObserver::class)]
class Milestone extends Model
{
    /** @use HasFactory<MilestoneFactory> */
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'x',
        'y',
        'date_label',
        'title',
        'description',
        'image',
        'sort_order',
    ];

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
