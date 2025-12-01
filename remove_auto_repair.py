#!/usr/bin/env python3
"""
Script to remove all AUTO-REPAIR blocks from server.py
"""

with open('/app/backend/server.py', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_block = False
skip_count = 0

for i, line in enumerate(lines):
    if '# AUTO-REPAIR FOR OLD JOBS' in line:
        skip_block = True
        skip_count = 0
        print(f"Found AUTO-REPAIR block at line {i+1}")
        continue
    
    if skip_block:
        skip_count += 1
        # Skip the next 26 lines (the entire repair block)
        if skip_count <= 26:
            continue
        else:
            skip_block = False
    
    new_lines.append(line)

with open('/app/backend/server.py', 'w') as f:
    f.writelines(new_lines)

print(f"Removed AUTO-REPAIR blocks. Total lines before: {len(lines)}, after: {len(new_lines)}")
