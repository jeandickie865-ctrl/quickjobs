#!/bin/bash

echo "🧪 Testing Job Creation API (POST /jobs)"
echo "=========================================="

BASE_URL="http://localhost:8001/api"

# Step 1: Register test employer
echo ""
echo "📝 Step 1: Register test employer..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jobtest@test.de",
    "password": "Test123!",
    "role": "employer"
  }')

echo "Response: $REGISTER_RESPONSE"

# Extract token and userId
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
  echo "❌ Failed to register employer or extract token/userId"
  exit 1
fi

echo "✅ Employer registered"
echo "   Token: ${TOKEN:0:20}..."
echo "   User ID: $USER_ID"

# Step 2: Create employer profile
echo ""
echo "📝 Step 2: Create employer profile..."
PROFILE_RESPONSE=$(curl -s -X POST "$BASE_URL/profiles/employer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"Employer\",
    \"company\": \"Test GmbH\",
    \"phone\": \"+49123456789\",
    \"email\": \"jobtest@test.de\",
    \"street\": \"Teststraße\",
    \"houseNumber\": \"1\",
    \"postalCode\": \"10115\",
    \"city\": \"Berlin\",
    \"lat\": 52.52,
    \"lon\": 13.405,
    \"paymentMethod\": \"card\",
    \"shortBio\": \"Test bio\"
  }")

echo "Response: $PROFILE_RESPONSE"
echo "✅ Employer profile created"

# Step 3: Create Job (THIS IS WHAT WE'RE TESTING)
echo ""
echo "📝 Step 3: Creating job via POST /jobs..."
echo ""
echo "🔍 REQUEST DETAILS:"
echo "   URL: $BASE_URL/jobs"
echo "   Method: POST"
echo "   Authorization: Bearer ${TOKEN:0:20}..."
echo ""

JOB_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employerType": "private",
    "title": "Test Job",
    "description": "This is a test job",
    "category": "gastronomie",
    "timeMode": "fixed_time",
    "startAt": "2025-12-01T10:00:00Z",
    "endAt": "2025-12-01T18:00:00Z",
    "address": {
      "street": "Hauptstraße",
      "postalCode": "10115",
      "city": "Berlin"
    },
    "lat": 52.52,
    "lon": 13.405,
    "workerAmountCents": 5000,
    "paymentToWorker": "cash",
    "required_all_tags": ["kellnern"],
    "required_any_tags": [],
    "status": "open"
  }')

# Extract HTTP status
HTTP_STATUS=$(echo "$JOB_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
JOB_BODY=$(echo "$JOB_RESPONSE" | sed '/HTTP_STATUS/d')

echo ""
echo "📦 REQUEST BODY:"
cat << 'EOF'
{
  "employerType": "private",
  "title": "Test Job",
  "description": "This is a test job",
  "category": "gastronomie",
  "timeMode": "fixed_time",
  "startAt": "2025-12-01T10:00:00Z",
  "endAt": "2025-12-01T18:00:00Z",
  "address": {
    "street": "Hauptstraße",
    "postalCode": "10115",
    "city": "Berlin"
  },
  "lat": 52.52,
  "lon": 13.405,
  "workerAmountCents": 5000,
  "paymentToWorker": "cash",
  "required_all_tags": ["kellnern"],
  "required_any_tags": [],
  "status": "open"
}
EOF

echo ""
echo "📡 RESPONSE:"
echo "   HTTP Status: $HTTP_STATUS"
echo "   Body: $JOB_BODY"

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo "✅ Job created successfully!"
  
  # Extract job ID
  JOB_ID=$(echo $JOB_BODY | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   Job ID: $JOB_ID"
  
  # Verify job was created
  echo ""
  echo "🔍 Verifying job was created..."
  VERIFY_RESPONSE=$(curl -s "$BASE_URL/jobs/employer/$USER_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "   Employer jobs: $VERIFY_RESPONSE"
else
  echo ""
  echo "❌ Job creation failed!"
  echo ""
  echo "🔍 CHECKING BACKEND LOGS..."
  echo "================================"
  tail -n 50 /var/log/supervisor/backend.err.log | grep -A 10 "POST /api/jobs\|ValidationError\|422\|500"
fi

echo ""
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo "✅ Employer registered: $USER_ID"
echo "✅ Employer profile created"
echo "📡 Job creation status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ ALL TESTS PASSED"
else
  echo "❌ JOB CREATION FAILED - See logs above"
fi

echo ""
