<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleEvent extends Model
{
    /** @use HasFactory<\Database\Factories\ScheduleEventFactory> */
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
            'event_date' => 'date',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
