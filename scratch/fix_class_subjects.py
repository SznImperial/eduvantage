import os
import urllib.request
import json

url = "https://sgkyxsdqcpxakeiuarwb.supabase.co/rest/v1/class_subjects?academic_year_id=is.null"
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

data = json.dumps({"academic_year_id": "cf815e03-c39e-4159-895c-9a4c0ea1c2bc"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')

try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        print(json.dumps(res_data, indent=2))
except Exception as e:
    print(e)
