# Extract session token from cookies.txt
SESSION_TOKEN=$(grep 'better-auth.session_token' ../cookies.txt | awk '{print $7}')

# Run curl to create the event (replace the URL with the actual API endpoint)
curl -X POST \
  'http://localhost:3000/api/games' \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  --data-binary @test-event.json \
  -i
