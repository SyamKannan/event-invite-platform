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

        return response()->json($this->payload($client), 201);
    }

    /**
     * Rename a client or reset their password. Resetting the password also
     * revokes every login token they hold, so an old device is signed out.
     */
    public function update(Request $request, User $client): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureClient($client);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => ['sometimes', 'string', 'max:255', 'alpha_dash', Rule::unique('users', 'username')->ignore($client->id)],
            'email' => ['sometimes', 'nullable', 'email', Rule::unique('users', 'email')->ignore($client->id)],
            'password' => ['sometimes', 'string', 'min:8'],
        ]);

        $client->update($data);

        if (isset($data['password'])) {
            $client->tokens()->delete();
        }

        return response()->json($this->payload($client));
    }

    /**
     * Invitations they owned become admin-only (owner_id is nullOnDelete).
     */
    public function destroy(Request $request, User $client): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureClient($client);

        $client->tokens()->delete();
        $client->delete();

        return response()->json(status: 204);
    }

    private function ensureAdmin(Request $request): void
    {
        if (! $request->user()->isAdmin()) {
            throw new AuthorizationException('Only an admin can manage client accounts.');
        }
    }

    private function ensureClient(User $user): void
    {
        abort_unless($user->isClient(), 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(User $client): array
    {
        return [
            'id' => $client->id,
            'name' => $client->name,
            'username' => $client->username,
            'email' => $client->email,
        ];
    }
}
