<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Stancl\Tenancy\Jobs\CreateDatabase;
use Stancl\Tenancy\Jobs\MigrateDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

$tenant = Tenant::find('ebcf502a-5bda-4acc-9149-36d218dc2c54');
if ($tenant) {
    echo "Tenant domains:\n";
    foreach ($tenant->domains as $d) { echo "- " . $d->domain . "\n"; }

    // Recreate the user explicitly as requested
    $tenant->run(function () {
        User::truncate();
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
        ]);
        echo "User created: " . $user->email . "\n";
    });
} else {
    echo "Tenant not found.\n";
}
