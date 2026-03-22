<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Public central routes
Route::post('/register', [AuthController::class, 'register']);