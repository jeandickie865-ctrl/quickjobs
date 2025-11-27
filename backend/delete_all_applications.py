import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def delete_all_applications():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    print("🗑️  Lösche ALLE Applications...")
    
    # Delete all documents in applications collection
    result = await db.applications.delete_many({})
    
    print(f"✅ {result.deleted_count} Applications gelöscht")
    
    # Close connection
    client.close()
    
    return result.deleted_count

if __name__ == "__main__":
    deleted_count = asyncio.run(delete_all_applications())
    print(f"\n📊 Zusammenfassung: {deleted_count} Dokumente aus db.applications gelöscht")
