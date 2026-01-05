curl -X POST 'http://localhost:8000/register' \
-H 'Content-Type: application/json' \
-d '{
  "wallet_address": "0x04EAd0f9970D9fFB6F915412371464342c324E2C",
  "company_name": "Test Construction Ltd",
  "email": "test@example.com",
  "password": "password123"
}'