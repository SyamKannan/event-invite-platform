<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Support\EventTypes;
use Illuminate\Http\JsonResponse;

/**
 * Exposes App\Support\EventTypes::ALL as JSON so the frontend never has to
 * hand-duplicate the list of supported event types, their modules, roles,
 * default theme, or copy strings.
 */
class EventTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(EventTypes::ALL);
    }
}
