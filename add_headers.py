#!/usr/bin/env python3
import os
import re

# Header Mappings für alle Screens
SCREEN_HEADERS = {
    # Employer Screens
    "/app/frontend/app/(employer)/profile.tsx": "Mein Profil",
    "/app/frontend/app/(employer)/edit-profile.tsx": "Profil bearbeiten",
    "/app/frontend/app/(employer)/matches.tsx": "Meine Matches",
    "/app/frontend/app/(employer)/applications.tsx": "Bewerbungen",
    "/app/frontend/app/(employer)/jobs/create.tsx": "Auftrag erstellen",
    "/app/frontend/app/(employer)/jobs/[id].tsx": "Auftragsdetails",
    "/app/frontend/app/(employer)/jobs/rate.tsx": "Worker bewerten",
    "/app/frontend/app/(employer)/registration/confirm.tsx": "Dokumente bestätigen",
    "/app/frontend/app/(employer)/registration/start.tsx": "Anmeldung starten",
    "/app/frontend/app/(employer)/registration/prepare.tsx": "Anmeldung vorbereiten",
    "/app/frontend/app/(employer)/registration/done.tsx": "Anmeldung abgeschlossen",
    
    # Worker Screens
    "/app/frontend/app/(worker)/profile.tsx": "Mein Profil",
    "/app/frontend/app/(worker)/edit-profile.tsx": "Profil bearbeiten",
    "/app/frontend/app/(worker)/matches.tsx": "Meine Matches",
    "/app/frontend/app/(worker)/applications.tsx": "Meine Bewerbungen",
    "/app/frontend/app/(worker)/alljobs/index.tsx": "Alle Jobs",
    "/app/frontend/app/(worker)/alljobs/[id].tsx": "Job Details",
    "/app/frontend/app/(worker)/rate.tsx": "Arbeitgeber bewerten",
    "/app/frontend/app/(worker)/feed.tsx": "Passende Jobs",
    "/app/frontend/app/(worker)/documents.tsx": "Meine Dokumente",
    "/app/frontend/app/(worker)/registration-data.tsx": "Anmeldedaten",
}

def add_import_if_missing(content):
    """Add AppHeader import if it's not already there"""
    if "from '../../../components/AppHeader'" in content or "from '../../components/AppHeader'" in content:
        return content
    
    # Find the last import statement
    import_pattern = r"(import .+ from .+;)"
    imports = re.findall(import_pattern, content)
    
    if imports:
        last_import = imports[-1]
        # Determine the correct import path based on file depth
        if "/app/(employer)/" in content or "/app/(worker)/" in content:
            if "/jobs/" in content or "/registration/" in content or "/alljobs/" in content or "/profile-wizard/" in content:
                import_line = "\nimport { AppHeader } from '../../../components/AppHeader';"
            else:
                import_line = "\nimport { AppHeader } from '../../components/AppHeader';"
        else:
            import_line = "\nimport { AppHeader } from '../components/AppHeader';"
        
        content = content.replace(last_import, last_import + import_line)
    
    return content

def process_file(filepath, header_title):
    """Process a single file to add AppHeader"""
    print(f"Processing: {filepath}")
    
    if not os.path.exists(filepath):
        print(f"  ⚠️  File not found, skipping")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add import
    content = add_import_if_missing(content)
    
    # Check if AppHeader is already used
    if "<AppHeader" in content:
        print(f"  ✓ AppHeader already present")
        return
    
    # Try to find SafeAreaView and add header after it
    # Pattern 1: <SafeAreaView ... edges={['top']}>
    pattern1 = r"(<SafeAreaView[^>]*edges=\{?\[?['\"]top['\"][\],\}][^>]*>)"
    if re.search(pattern1, content):
        replacement = r"\1\n      <AppHeader title=\"" + header_title + "\" />"
        content = re.sub(pattern1, replacement, content, count=1)
        print(f"  ✓ Added header after SafeAreaView (pattern 1)")
    else:
        # Pattern 2: <SafeAreaView ... style={{...}}>
        pattern2 = r"(<SafeAreaView[^>]*>)"
        if re.search(pattern2, content):
            replacement = r"\1\n      <AppHeader title=\"" + header_title + "\" />"
            content = re.sub(pattern2, replacement, content, count=1)
            print(f"  ✓ Added header after SafeAreaView (pattern 2)")
        else:
            print(f"  ⚠️  Could not find SafeAreaView")
            return
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Done")

def main():
    print("=" * 60)
    print("Adding AppHeader to all screens")
    print("=" * 60)
    
    for filepath, title in SCREEN_HEADERS.items():
        process_file(filepath, title)
        print()
    
    print("=" * 60)
    print("✅ All files processed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
