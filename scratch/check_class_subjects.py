import os
import urllib.request
import json

url = "https://sgkyxsdqcpxakeiuarwb.supabase.co/rest/v1/class_subjects?select=*"
req = urllib.request.Request(url)
req.add_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88')
req.add_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3l4c2RxY3B4YWtlaXVhcndiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQyNjQ0MCwiZXhwIjoyMDk2MDAyNDQwfQ.7_c-cLOt7_mDYBnaYMZXHwY_ZcAWqB5J5Mt0JixZV88')

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))
    print(json.dumps(data, indent=2))
