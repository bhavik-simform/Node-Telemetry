#!/bin/bash

echo "Starting traffic generator..."
echo "Press Ctrl+C to stop"

while true; do
  # Generate a valid user
  USER_RESP=$(curl -s -X POST http://localhost:3001/users -H "Content-Type: application/json" -d "{\"name\":\"User $RANDOM\", \"email\":\"user$RANDOM@test.com\"}")
  USER_ID=$(echo $USER_RESP | grep -o '"id":[^,]*' | cut -d: -f2)

  # Fallback to 1 if we couldn't parse it
  if [ -z "$USER_ID" ]; then
    USER_ID=1
  fi
  
  # Fetch the valid user
  curl -s "http://localhost:3001/users/$USER_ID" > /dev/null
  
  # Generate a 404 on user-service
  curl -s "http://localhost:3001/users/99999" > /dev/null
  
  # Generate a 5xx error on user-service (violates NOT NULL email constraint)
  curl -s -X POST http://localhost:3001/users -H "Content-Type: application/json" -d "{\"name\":\"Invalid User\"}" > /dev/null

  # Generate a valid order
  curl -s -X POST http://localhost:3002/orders -H "Content-Type: application/json" -d "{\"user_id\": $USER_ID, \"product\": \"Laptop\", \"amount\": 1200}" > /dev/null


  # Generate a 404 on order-service
  curl -s "http://localhost:3002/orders/99999" > /dev/null

  # Generate a 5xx error on order-service (violates NOT NULL amount constraint)
  curl -s -X POST http://localhost:3002/orders -H "Content-Type: application/json" -d "{\"user_id\": 1, \"product\": \"Invalid Order\"}" > /dev/null

  # Trigger notification service health endpoint
  curl -s "http://localhost:3003/health" > /dev/null

  echo "Generated a batch of requests (200s, 404s, 500s)..."
  sleep 1
done
