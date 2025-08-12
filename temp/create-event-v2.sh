#!/bin/bash

# Extract session token from cookies.txt
SESSION_TOKEN=$(grep 'better-auth.session_token' ../cookies.txt | awk '{print $7}')

echo "使用 Session Token: $SESSION_TOKEN"
echo "建立賽事中..."

# Run curl to create the event
curl -X POST \
  'http://localhost:3000/api/games' \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  --data-binary @test-event-v2.json \
  -i
