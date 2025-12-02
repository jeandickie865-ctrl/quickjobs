#!/usr/bin/env python3
"""
Migration Script: Add accountType to existing employer users
Run once to update all existing employers to accountType="private"
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def migrate_account_types():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["shiftmatch"]
    
    print("🔄 Starting migration: Adding accountType to existing employers...")
    
    # Update all employers without accountType
    result = await db.users.update_many(
        {
            "role": "employer",
            "accountType": {"$exists": False}
        },
        {
            "$set": {"accountType": "private"}
        }
    )
    
    print(f"✅ Migration complete!")
    print(f"   Updated {result.modified_count} employer user(s)")
    print(f"   Matched {result.matched_count} employer user(s)")
    
    # Verify
    all_employers = await db.users.count_documents({"role": "employer"})
    with_account_type = await db.users.count_documents({
        "role": "employer",
        "accountType": {"$exists": True}
    })
    
    print(f"\n📊 Verification:")
    print(f"   Total employers: {all_employers}")
    print(f"   With accountType: {with_account_type}")
    
    if all_employers == with_account_type:
        print("   ✅ All employers have accountType!")
    else:
        print(f"   ⚠️ {all_employers - with_account_type} employers still missing accountType")

if __name__ == "__main__":
    asyncio.run(migrate_account_types())
