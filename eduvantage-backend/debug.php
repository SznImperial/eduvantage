<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

$tenantId = 'ebcf502a-5bda-4acc-9149-36d218dc2c54';
$tenant = Tenant::find($tenantId);

if (!$tenant) { echo "Tenant not found.\n"; exit; }

$tenant->run(function () {
    User::truncate(); // Clean up from previous attempts
    $user = User::create([
        'name' => 'Admin',
        'email' => 'admin@test.com',
        'password' => Hash::make('password'),
    ]);
    echo "Created missing admin user: {$user->email}\n";
});

// Test GET /
echo "\n--- Testing GET / ---\n";
try {
    $request = Request::create('/', 'GET');
    $request->headers->set('Host', 'test-school.localhost');
    $response = $kernel->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() >= 500) {
        echo "Exception: ";
        if ($response->exception) echo $response->exception->getMessage() . "\n" . $response->exception->getTraceAsString();
        else echo substr($response->getContent(), 0, 500);
    } else {
        echo "Content: " . $response->getContent() . "\n";
    }
} catch (\Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}

// Test POST /api/login
echo "\n--- Testing POST /api/login ---\n";
try {
    $request = Request::create('/api/login', 'POST', [
        'email' => 'admin@test.com',
        'password' => 'password'
    ]);
    $request->headers->set('Host', 'test-school.localhost');
    $request->headers->set('Accept', 'application/json');
    $response = $kernel->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
