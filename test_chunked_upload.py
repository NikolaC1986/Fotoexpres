#!/usr/bin/env python3
"""
Test script to verify chunked upload functionality for Ghost Orders fix.
This tests that large orders (split into chunks) are properly saved.
"""

import requests
import json
import os
import io
from PIL import Image

API_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://photo-orders.preview.emergentagent.com')
API = f"{API_URL}/api"

def create_test_image(filename="test_photo.jpg"):
    """Create a simple test image in memory"""
    img = Image.new('RGB', (800, 600), color='blue')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    return img_byte_arr

def test_chunked_upload():
    """Test creating an order with chunked upload (simulating large batch)"""
    print("=" * 80)
    print("🔍 TEST: Chunked Upload (Large Order) Verification")
    print("=" * 80)
    
    # Simulate uploading 6 photos in 3 chunks (2 photos per chunk)
    TOTAL_PHOTOS = 6
    CHUNK_SIZE = 2
    TOTAL_CHUNKS = 3
    
    print(f"\n📋 Test Configuration:")
    print(f"   Total Photos: {TOTAL_PHOTOS}")
    print(f"   Chunk Size: {CHUNK_SIZE}")
    print(f"   Total Chunks: {TOTAL_CHUNKS}")
    
    order_details_base = {
        "contactInfo": {
            "fullName": "Chunked Test Korisnik",
            "email": "chunked@example.com",
            "phone": "065 999 8888",
            "street": "Chunk Street 123",
            "postalCode": "11000",
            "city": "Beograd",
            "notes": "Test chunked upload za Ghost Orders bug fix"
        },
        "photoSettings": [
            {"fileName": f"chunk_photo_{i+1}.jpg", "format": "10x15", "quantity": 1, "finish": "glossy"}
            for i in range(TOTAL_PHOTOS)
        ],
        "totalPrice": 108,  # 6 photos * 18 RSD
        "quantityDiscountAmount": 0,
        "promotionDiscountAmount": 0,
        "quantityDiscountPercent": 0,
        "promotionDiscountPercent": 0,
        "deliveryFee": 400,
        "deliveryPrice": 400,
        "freeDeliveryLimit": 5000,
        "grandTotal": 508,
        "prices": {
            "9x13": 12,
            "10x15": 18,
            "13x18": 25,
            "15x21": 50,
            "20x30": 150,
            "30x45": 250
        },
        "cropOption": False,
        "fillWhiteOption": False
    }
    
    order_number = None
    
    # Upload in chunks
    for chunk_index in range(TOTAL_CHUNKS):
        is_last_chunk = (chunk_index == TOTAL_CHUNKS - 1)
        
        print(f"\n📤 Chunk {chunk_index + 1}/{TOTAL_CHUNKS} {'(FINAL)' if is_last_chunk else ''}:")
        print(f"   Creating {CHUNK_SIZE} test images...")
        
        # Create files for this chunk
        files = []
        for i in range(CHUNK_SIZE):
            photo_index = chunk_index * CHUNK_SIZE + i
            img_data = create_test_image(f"chunk_photo_{photo_index+1}.jpg")
            files.append(('photos', (f'chunk_photo_{photo_index+1}.jpg', img_data, 'image/jpeg')))
        
        # Prepare order details for this chunk
        order_details = {
            **order_details_base,
            "chunkIndex": chunk_index,
            "totalChunks": TOTAL_CHUNKS,
            "isLastChunk": is_last_chunk,
        }
        
        if order_number:
            order_details["orderNumber"] = order_number
        
        print(f"   Uploading chunk {chunk_index + 1}/{TOTAL_CHUNKS}...")
        
        try:
            response = requests.post(
                f"{API}/orders/create",
                files=files,
                data={'order_details': json.dumps(order_details)},
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"❌ ERROR: Expected 200, got {response.status_code}")
                print(f"   Response: {response.text}")
                return False
            
            response_data = response.json()
            
            if not response_data.get('success'):
                print(f"❌ ERROR: Chunk upload failed")
                print(f"   Message: {response_data.get('message')}")
                return False
            
            # Store order number from first chunk
            if not order_number:
                order_number = response_data.get('orderNumber')
                if not order_number:
                    print(f"❌ ERROR: No order number received from first chunk")
                    return False
                print(f"   ✅ Order number received: {order_number}")
            else:
                # Verify subsequent chunks return the same order number
                if response_data.get('orderNumber') != order_number:
                    print(f"❌ ERROR: Order number mismatch!")
                    print(f"   Expected: {order_number}")
                    print(f"   Got: {response_data.get('orderNumber')}")
                    return False
                print(f"   ✅ Chunk uploaded (order: {order_number})")
            
            # For last chunk, verify ZIP was created
            if is_last_chunk:
                zip_path = response_data.get('zipFilePath')
                if not zip_path:
                    print(f"❌ ERROR: No ZIP file path in final response")
                    return False
                print(f"   ✅ ZIP created: {zip_path}")
            
        except requests.exceptions.Timeout:
            print(f"❌ ERROR: Chunk {chunk_index + 1} upload timed out")
            return False
        except Exception as e:
            print(f"❌ ERROR in chunk {chunk_index + 1}: {str(e)}")
            return False
    
    print(f"\n🔍 Verifying order {order_number} in database...")
    
    try:
        retrieve_response = requests.get(
            f"{API}/orders/{order_number}",
            timeout=30
        )
        
        if retrieve_response.status_code == 200:
            order_data = retrieve_response.json()
            print(f"✅ Order {order_number} found in database!")
            print(f"   Order Number: {order_data.get('orderNumber')}")
            print(f"   Customer: {order_data.get('contactInfo', {}).get('fullName')}")
            print(f"   Status: {order_data.get('status', 'N/A')}")
            print(f"   Total Photos: {order_data.get('totalPhotos', 'N/A')}")
            print(f"   Photo Settings Count: {len(order_data.get('photoSettings', []))}")
            
            # Verify all photos are accounted for
            if order_data.get('totalPhotos') != TOTAL_PHOTOS:
                print(f"⚠️  WARNING: Expected {TOTAL_PHOTOS} photos, got {order_data.get('totalPhotos')}")
                return False
            
            if order_data.get('status') != 'completed':
                print(f"⚠️  WARNING: Order status should be 'completed', got '{order_data.get('status')}'")
                return False
            
            print("\n✅ All verifications passed for chunked upload!")
            return True
            
        elif retrieve_response.status_code == 404:
            print(f"❌ CRITICAL: Order {order_number} NOT FOUND after chunked upload!")
            print(f"   This indicates a GHOST ORDER bug with chunked uploads!")
            return False
        else:
            print(f"❌ ERROR: Unexpected status {retrieve_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR during verification: {str(e)}")
        return False

def main():
    print("\n🚀 Starting Chunked Upload Test for Ghost Orders Fix\n")
    
    test_passed = test_chunked_upload()
    
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    if test_passed:
        print("✅ PASSED - Chunked Upload & Verification")
        print("\n🎉 Chunked upload test PASSED! Ghost Orders bug is FIXED for large uploads! 🎉\n")
        return True
    else:
        print("❌ FAILED - Chunked Upload & Verification")
        print("\n⚠️  Chunked upload test failed. Bug may still be present for large orders.\n")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
