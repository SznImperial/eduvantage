<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use Illuminate\Http\Request;

try {
    $request = Request::create('/api/login', 'POST', ['email' => 'admin@test.com', 'password' => 'password']);
    $request->headers->set('Host', 'test-school.localhost');
    $request->headers->set('Accept', 'application/json');
    $response = $kernel->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() >= 500) {
        if ($response->exception) {
            echo "Exception: " . $response->exception->getMessage() . "\n";
            echo $response->exception->getTraceAsString();
        } else {
            echo "Body: " . substr($response->getContent(), 0, 500);
        }
    } else {
        echo "Response token exists: " . (str_contains($response->getContent(), 'token') ? 'Yes' : 'No') . "\n";
    }
} catch (\Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
