#!/usr/bin/env python3
"""
Seed initial products into the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initial products
INITIAL_PRODUCTS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Album za Slike",
        "type": "album",
        "description": "Profesionalni album za vaše najlepše uspomene. Nakon narudžbine, naš tim će kreirati personalizovani dizajn koji će vam biti poslat na odobrenje pre štampe.",
        "imageUrl": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
        "variants": [
            {
                "id": str(uuid.uuid4()),
                "name": "50 fotografija",
                "description": "Album sa 25 stranica (50 fotografija)",
                "price": 5000,
                "available": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "100 fotografija",
                "description": "Album sa 50 stranica (100 fotografija)",
                "price": 9000,
                "available": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "200 fotografija",
                "description": "Album sa 100 stranica (200 fotografija)",
                "price": 16000,
                "available": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "300 fotografija",
                "description": "Album sa 150 stranica (300 fotografija)",
                "price": 22000,
                "available": True
            }
        ],
        "available": True,
        "minPhotos": 50,
        "maxPhotos": 300,
        "allowCustomText": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Šolja sa Štampom",
        "type": "mug",
        "description": "Personalizovana šolja sa vašim fotografijama. Možete dodati 1-3 fotografije i custom tekst. Naš tim će kreirati dizajn i poslati vam na odobrenje pre štampe.",
        "imageUrl": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
        "variants": [
            {
                "id": str(uuid.uuid4()),
                "name": "Keramička šolja",
                "description": "Klasična keramička šolja (330ml)",
                "price": 1200,
                "available": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Magična šolja",
                "description": "Magična šolja koja menja boju (330ml)",
                "price": 1500,
                "available": True
            }
        ],
        "available": True,
        "minPhotos": 1,
        "maxPhotos": 3,
        "allowCustomText": True,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Privezak za Ključeve",
        "type": "keychain",
        "description": "Personalizovani privezak sa vašom fotografijom. Savršen poklon ili uspomena. Naš tim će pripremiti dizajn i poslati vam na odobrenje.",
        "imageUrl": "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800",
        "variants": [
            {
                "id": str(uuid.uuid4()),
                "name": "Standardni privezak",
                "description": "Metalni privezak sa fotografijom (5x5cm)",
                "price": 500,
                "available": True
            }
        ],
        "available": True,
        "minPhotos": 1,
        "maxPhotos": 1,
        "allowCustomText": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Fotokalendar",
        "type": "calendar",
        "description": "Personalizovani kalendar sa vašim fotografijama. Izaberite fotografije, a naš tim će kreirati dizajn i poslati vam na odobrenje pre štampe.",
        "imageUrl": "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800",
        "variants": [
            {
                "id": str(uuid.uuid4()),
                "name": "Zidni kalendar A3",
                "description": "Zidni kalendar formata A3 (12 meseci + naslovnica)",
                "price": 2500,
                "available": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Stoni kalendar A5",
                "description": "Stoni kalendar formata A5 (12 meseci)",
                "price": 1800,
                "available": True
            }
        ],
        "available": True,
        "minPhotos": 12,
        "maxPhotos": 13,
        "allowCustomText": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Fotomagnet",
        "type": "magnet",
        "description": "Personalizovani magnet za frižider sa vašom fotografijom. Naš tim će pripremiti dizajn i poslati vam na odobrenje.",
        "imageUrl": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800",
        "variants": [
            {
                "id": str(uuid.uuid4()),
                "name": "Kvadratni magnet 10x10cm",
                "description": "Kvadratni magnet 10x10cm",
                "price": 350,
                "available": True
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pravougaoni magnet 15x10cm",
                "description": "Pravougaoni magnet 15x10cm",
                "price": 450,
                "available": True
            }
        ],
        "available": True,
        "minPhotos": 1,
        "maxPhotos": 1,
        "allowCustomText": False,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_products():
    """Seed initial products into database"""
    print("🌱 Seeding products...")
    
    # Check if products already exist
    existing_count = await db.products.count_documents({})
    if existing_count > 0:
        print(f"⚠️  Database already has {existing_count} products. Skipping seed.")
        print("💡 If you want to re-seed, delete existing products first.")
        return
    
    # Insert initial products
    result = await db.products.insert_many(INITIAL_PRODUCTS)
    print(f"✅ Successfully seeded {len(result.inserted_ids)} products:")
    
    for product in INITIAL_PRODUCTS:
        print(f"   - {product['name']} ({len(product['variants'])} variants)")
    
    print("\n🎉 Seeding complete!")

async def main():
    try:
        await seed_products()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
