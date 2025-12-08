#!/usr/bin/env python3
import os
import re

def fix_file(filepath):
    """Remove duplicate AppHeader imports from a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count how many times AppHeader is imported
    matches = re.findall(r"import\s+\{[^}]*AppHeader[^}]*\}\s+from\s+['\"].*AppHeader['\"];?", content)
    
    if len(matches) <= 1:
        return False  # No duplicates
    
    print(f"Found {len(matches)} AppHeader imports in {filepath}")
    
    # Keep only the first import, remove all others
    first_match = matches[0]
    for match in matches[1:]:
        content = content.replace(match + '\n', '', 1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Fixed!")
    return True

def main():
    fixed_count = 0
    
    # Find all TypeScript files in app directory
    for root, dirs, files in os.walk('/app/frontend/app'):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
