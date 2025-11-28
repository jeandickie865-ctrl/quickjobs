#!/bin/bash
# Fix all hardcoded URLs in store files
cd /app/frontend/utils
for file in employerProfileStore.ts jobStore.ts profileStore.ts reviewStore.ts; do
  sed -i "s|Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://job-market-preview.preview.emergentagent.com'|process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || ''|g" "$file"
done
echo "Fixed all store URLs"
