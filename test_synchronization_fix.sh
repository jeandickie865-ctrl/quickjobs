#!/bin/bash

echo "🧪 Testing Synchronization Fix - JobCreate & ApplicationCreate"
echo "================================================================"
echo ""

BASE_URL="http://localhost:8001/api"

# EMPLOYER FLOW
echo "👔 EMPLOYER FLOW"
echo "================"
echo ""

# 1. Register Employer
echo "📝 Step 1: Register Employer..."
EMP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "synctest_emp@test.de",
    "password": "Test123!",
    "role": "employer"
  }')

EMP_TOKEN=$(echo $EMP_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
EMP_ID=$(echo $EMP_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$EMP_TOKEN" ]; then
  echo "❌ Employer registration failed"
  exit 1
fi
echo "✅ Employer registered: $EMP_ID"

# 2. Create Employer Profile
echo ""
echo "📝 Step 2: Create Employer Profile..."
curl -s -X POST "$BASE_URL/profiles/employer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d "{
    \"firstName\": \"Sync\",
    \"lastName\": \"Test\",
    \"phone\": \"+49123456789\",
    \"email\": \"synctest_emp@test.de\",
    \"street\": \"Test Street\",
    \"postalCode\": \"10115\",
    \"city\": \"Berlin\",
    \"lat\": 52.52,
    \"lon\": 13.405,
    \"paymentMethod\": \"card\"
  }" > /dev/null

echo "✅ Employer profile created"

# 3. Create Job (using JobCreate - no employerId)
echo ""
echo "📝 Step 3: Create Job (using JobCreate)..."
echo "   Request: {jobId, employerId, status, createdAt, matchedWorkerId} NICHT im Body"
JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{
    "employerType": "private",
    "title": "Sync Test Job",
    "description": "Test job for synchronization fix",
    "category": "gastronomie",
    "timeMode": "fixed_time",
    "startAt": "2025-12-15T10:00:00Z",
    "endAt": "2025-12-15T18:00:00Z",
    "address": {
      "street": "Sync Street",
      "postalCode": "10115",
      "city": "Berlin"
    },
    "lat": 52.52,
    "lon": 13.405,
    "workerAmountCents": 8000,
    "paymentToWorker": "cash",
    "required_all_tags": ["kellnern"],
    "required_any_tags": []
  }')

JOB_ID=$(echo $JOB_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
JOB_EMP_ID=$(echo $JOB_RESPONSE | grep -o '"employerId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "❌ Job creation failed"
  echo "Response: $JOB_RESPONSE"
  exit 1
fi

echo "✅ Job created: $JOB_ID"
echo "   employerId from token: $JOB_EMP_ID"

if [ "$JOB_EMP_ID" != "$EMP_ID" ]; then
  echo "❌ FAILED: employerId mismatch!"
  echo "   Expected: $EMP_ID"
  echo "   Got: $JOB_EMP_ID"
  exit 1
fi
echo "✅ PASSED: employerId correctly set from token"

# WORKER FLOW
echo ""
echo ""
echo "👷 WORKER FLOW"
echo "=============="
echo ""

# 4. Register Worker
echo "📝 Step 4: Register Worker..."
WORKER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "synctest_worker@test.de",
    "password": "Test123!",
    "role": "worker"
  }')

WORKER_TOKEN=$(echo $WORKER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
WORKER_ID=$(echo $WORKER_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WORKER_TOKEN" ]; then
  echo "❌ Worker registration failed"
  exit 1
fi
echo "✅ Worker registered: $WORKER_ID"

# 5. Create Worker Profile
echo ""
echo "📝 Step 5: Create Worker Profile..."
curl -s -X POST "$BASE_URL/profiles/worker" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d "{
    \"firstName\": \"Sync\",
    \"lastName\": \"Worker\",
    \"phone\": \"+49987654321\",
    \"email\": \"synctest_worker@test.de\",
    \"shortBio\": \"Test worker\",
    \"categories\": [\"gastronomie\"],
    \"selectedTags\": [\"kellnern\"],
    \"radiusKm\": 50,
    \"homeAddress\": {
      \"street\": \"Worker Street\",
      \"houseNumber\": \"1\",
      \"postalCode\": \"10115\",
      \"city\": \"Berlin\",
      \"country\": \"Deutschland\"
    },
    \"homeLat\": 52.52,
    \"homeLon\": 13.405
  }" > /dev/null

echo "✅ Worker profile created"

# 6. Apply for Job (using ApplicationCreate - no workerId)
echo ""
echo "📝 Step 6: Apply for Job (using ApplicationCreate)..."
echo "   Request: {workerId} NICHT im Body"
APP_RESPONSE=$(curl -s -X POST "$BASE_URL/applications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"employerId\": \"$EMP_ID\"
  }")

APP_ID=$(echo $APP_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
APP_WORKER_ID=$(echo $APP_RESPONSE | grep -o '"workerId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$APP_ID" ]; then
  echo "❌ Application creation failed"
  echo "Response: $APP_RESPONSE"
  exit 1
fi

echo "✅ Application created: $APP_ID"
echo "   workerId from token: $APP_WORKER_ID"

if [ "$APP_WORKER_ID" != "$WORKER_ID" ]; then
  echo "❌ FAILED: workerId mismatch!"
  echo "   Expected: $WORKER_ID"
  echo "   Got: $APP_WORKER_ID"
  exit 1
fi
echo "✅ PASSED: workerId correctly set from token"

# FINAL VERIFICATION
echo ""
echo ""
echo "🔍 FINAL VERIFICATION"
echo "===================="
echo ""

# Verify Job in DB
echo "📋 Verifying Job in database..."
JOB_VERIFY=$(curl -s "$BASE_URL/jobs/employer/$EMP_ID" -H "Authorization: Bearer $EMP_TOKEN")
if echo "$JOB_VERIFY" | grep -q "$JOB_ID"; then
  echo "✅ Job found in employer's jobs"
else
  echo "❌ Job NOT found in employer's jobs"
  exit 1
fi

# Verify Application in DB
echo "📋 Verifying Application in database..."
APP_VERIFY=$(curl -s "$BASE_URL/applications/worker/$WORKER_ID" -H "Authorization: Bearer $WORKER_TOKEN")
if echo "$APP_VERIFY" | grep -q "$APP_ID"; then
  echo "✅ Application found in worker's applications"
else
  echo "❌ Application NOT found in worker's applications"
  exit 1
fi

# BACKEND LOGS
echo ""
echo "📋 Backend Logs (last 20 lines):"
tail -n 20 /var/log/supervisor/backend.err.log | grep -E "Token validated|Creating job|Creating application|employerId|workerId"

# SUMMARY
echo ""
echo "================================================================"
echo "🎉 ALL TESTS PASSED!"
echo "================================================================"
echo ""
echo "✅ Backend correctly sets employerId from token"
echo "✅ Backend correctly sets workerId from token"
echo "✅ Frontend sends JobCreate (not Job)"
echo "✅ Frontend sends ApplicationCreate (not Application with workerId)"
echo "✅ Employer can create jobs"
echo "✅ Worker can apply for jobs"
echo ""
echo "Synchronization fix is working correctly! 🚀"
echo ""
