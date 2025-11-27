import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def verify_empty():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    print("🔍 Überprüfe db.applications...")
    
    # Count documents
    count = await db.applications.count_documents({})
    
    print(f"📊 Anzahl der Dokumente in db.applications: {count}")
    
    if count == 0:
        print("✅ BESTÄTIGT: db.applications ist leer")
    else:
        print(f"⚠️  WARNUNG: db.applications enthält noch {count} Dokumente")
    
    # Close connection
    client.close()
    
    return count

if __name__ == "__main__":
    count = asyncio.run(verify_empty())
