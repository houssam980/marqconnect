#!/bin/bash

# Login and get token
echo "Logging in..."
TOKEN=$(curl -s -X POST http://104.248.226.62/api/login \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"email":"mohammed@marqen.com","password":"marqen123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:20}..."

# Test clear route
echo "Testing DELETE /api/messages/general/clear..."
curl -v -X DELETE http://104.248.226.62/api/messages/general/clear \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' \
  2>&1 | head -25
