#!/bin/bash

# Liste der Dateien die wir aktualisieren wollen (wichtigste Screens)
declare -A FILES
FILES["/app/frontend/app/(employer)/applications.tsx"]="Bewerbungen"
FILES["/app/frontend/app/(employer)/edit-profile.tsx"]="Profil bearbeiten"
FILES["/app/frontend/app/(worker)/profile.tsx"]="Mein Profil"
FILES["/app/frontend/app/(worker)/edit-profile.tsx"]="Profil bearbeiten"
FILES["/app/frontend/app/(worker)/applications.tsx"]="Meine Bewerbungen"
FILES["/app/frontend/app/(worker)/alljobs/index.tsx"]="Alle Jobs"
FILES["/app/frontend/app/(worker)/feed.tsx"]="Passende Jobs"
FILES["/app/frontend/app/(worker)/documents.tsx"]="Meine Dokumente"

echo "Adding headers to key screens..."
for file in "${!FILES[@]}"; do
    title="${FILES[$file]}"
    if [ -f "$file" ]; then
        echo "Processing: $file -> '$title'"
        # Add import if not present
        if ! grep -q "AppHeader" "$file"; then
            # Find the depth for import path
            if [[ "$file" == *"/alljobs/"* ]] || [[ "$file" == *"/jobs/"* ]]; then
                import_line="import { AppHeader } from '../../../components/AppHeader';"
            else
                import_line="import { AppHeader } from '../../components/AppHeader';"
            fi
            # Add import after last existing import
            sed -i "/^import .* from .*;$/a\\
$import_line" "$file"
        fi
    else
        echo "  ⚠️  File not found: $file"
    fi
done

echo "Done!"
