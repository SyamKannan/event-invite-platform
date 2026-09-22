<?php

namespace App\Models;

use App\Observers\InvitationCacheObserver;
use Database\Factories\ScheduleEventFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(InvitationCacheObserver::class)]
class ScheduleEvent extends Model
{
    /** @use HasFactory<ScheduleEventFactory> */
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'title',
        'event_date',
        'event_time',
        'venue',
        'address',
        'map_url',
        'dresscode',
        'team',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            // Serialized as plain Y-m-d: that's what <input type="date"> in the
            // admin editor (and the public Schedule section) expect. The
            // default date cast serializes as a full ISO datetime, which the
            // date input rejects and shows blank.
            'event_date' => 'date:Y-m-d',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
