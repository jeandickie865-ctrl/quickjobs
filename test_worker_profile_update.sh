#!/bin/bash

echo "🧪 Testing Worker Profile Update Flow"
echo "======================================"

BASE_URL="http://localhost:8001/api"

# Step 1: Register a test user
echo ""
echo "📝 Step 1: Register test worker..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updatetest@test.de",
    "password": "Test123!",
    "role": "worker"
  }')

echo "Response: $REGISTER_RESPONSE"

# Extract token and userId
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
  echo "❌ Failed to register user or extract token/userId"
  exit 1
fi

echo "✅ User registered"
echo "   Token: ${TOKEN:0:20}..."
echo "   User ID: $USER_ID"

# Step 2: Create initial profile
echo ""
echo "📝 Step 2: Create initial worker profile..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/profiles/worker" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"firstName\": \"Max\",
    \"lastName\": \"Mustermann\",
    \"phone\": \"+49123456789\",
    \"email\": \"updatetest@test.de\",
    \"shortBio\": \"Initial bio\",
    \"categories\": [\"gastronomie\"],
    \"selectedTags\": [\"kellnern\"],
    \"radiusKm\": 25,
    \"homeAddress\": {
      \"street\": \"Teststraße\",
      \"houseNumber\": \"1\",
      \"postalCode\": \"10115\",
      \"city\": \"Berlin\",
      \"country\": \"Deutschland\"
    },
    \"homeLat\": 52.52,
    \"homeLon\": 13.405
  }")

echo "Response: $CREATE_RESPONSE"

if echo "$CREATE_RESPONSE" | grep -q "userId"; then
  echo "✅ Profile created successfully"
else
  echo "❌ Failed to create profile"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

# Step 3: Update profile (PUT)
echo ""
echo "📝 Step 3: Update worker profile via PUT..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/profiles/worker/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"firstName\": \"Maximilian\",
    \"lastName\": \"Musterfrau\",
    \"phone\": \"+49987654321\",
    \"email\": \"updatetest@test.de\",
    \"shortBio\": \"Updated bio - This is my new description\",
    \"categories\": [\"sicherheit\", \"gastronomie\"],
    \"selectedTags\": [\"kellnern\", \"bewacher\"],
    \"radiusKm\": 50,
    \"homeAddress\": {
      \"street\": \"Neue Straße\",
      \"houseNumber\": \"42\",
      \"postalCode\": \"10117\",
      \"city\": \"Berlin\",
      \"country\": \"Deutschland\"
    },
    \"homeLat\": 52.53,
    \"homeLon\": 13.406
  }")

echo "Response: $UPDATE_RESPONSE"

if echo "$UPDATE_RESPONSE" | grep -q "Maximilian"; then
  echo "✅ Profile updated successfully"
  echo "   ✓ firstName: Maximilian"
  echo "   ✓ lastName: Musterfrau"
  echo "   ✓ shortBio: Updated"
  echo "   ✓ categories: 2 items"
  echo "   ✓ radius: 50 km"
else
  echo "❌ Failed to update profile"
  echo "Response: $UPDATE_RESPONSE"
  exit 1
fi

# Step 4: Verify update (GET)
echo ""
echo "📝 Step 4: Verify profile update via GET..."
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/profiles/worker/$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $GET_RESPONSE"

# Verify updated values
if echo "$GET_RESPONSE" | grep -q "Maximilian" && \
   echo "$GET_RESPONSE" | grep -q "Updated bio" && \
   echo "$GET_RESPONSE" | grep -q "50"; then
  echo "✅ Profile verification successful"
  echo "   ✓ Name updated correctly"
  echo "   ✓ Bio updated correctly"
  echo "   ✓ Radius updated correctly"
else
  echo "❌ Profile verification failed"
  echo "Response: $GET_RESPONSE"
  exit 1
fi

echo ""
echo "======================================"
echo "🎉 All tests passed! Worker Profile Update Flow is working correctly."
echo ""
