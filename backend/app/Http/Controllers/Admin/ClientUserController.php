<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;

class ClientUserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->ensureAdmin($request);

        return JsonResource::collection(
            User::where('role', 'client')->orderBy('name')->get(['id', 'name', 'username', 'email'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('users', 'username')],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $client = User::create([...$data, 'role' => 'client']);

        return response()->json([
            'id' => $client->id,
            'name' => $client->name,
            'username' => $client->username,
            'email' => $client->email,
        ], 201);
    }

    private function ensureAdmin(Request $request): void
    {
        if (! $request->user()->isAdmin()) {
            throw new AuthorizationException('Only an admin can manage client accounts.');
        }
    }
}
