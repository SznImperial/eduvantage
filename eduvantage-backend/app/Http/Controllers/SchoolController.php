<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'students' => 150,
                'teachers' => 12,
                'classes' => 8,
                'tenant_id' => tenant('id')
            ]
        ]);
    }
}
