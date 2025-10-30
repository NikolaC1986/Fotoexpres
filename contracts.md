# API Contracts & Integration Plan

## Overview
This document outlines the backend implementation for the photo printing website. The frontend is currently using mock data stored in localStorage. We need to build a backend that handles photo uploads, order creation, and generates zip files with photos + order details.

## Current Mock Data (Frontend)
- **Location**: `UploadPage.jsx` - line ~72 (handleSubmit function)
- **Mock behavior**: Stores order in localStorage with structure:
  ```json
  {
    "orderNumber": "ORD-123456",
    "photos": [...],
    "contactInfo": {...}
  }
  ```

## API Endpoints to Implement

### 1. POST /api/orders/create
**Purpose**: Create a new order with photos and contact information

**Request Body** (multipart/form-data):
- `photos[]`: Array of image files
- `order_details`: JSON string containing:
  ```json
  {
    "contactInfo": {
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "notes": "string (optional)"
    },
    "photoSettings": [
      {
        "fileName": "string",
        "format": "10x15|13x18|15x21|20x30",
        "quantity": "number",
        "finish": "glossy|matte"
      }
    ]
  }
  ```

**Response**:
```json
{
  "success": true,
  "orderNumber": "ORD-123456",
  "message": "Order created successfully",
  "zipFilePath": "/path/to/order-ORD-123456.zip"
}
```

**Backend Processing**:
1. Generate unique order number (ORD-XXXXXX format)
2. Create order directory: `/app/backend/orders/ORD-XXXXXX/`
3. Save all uploaded photos to order directory
4. Create `order_details.txt` with:
   ```
   ORDER NUMBER: ORD-123456
   DATE: 2025-01-30 12:30:45
   
   CUSTOMER INFORMATION:
   Name: John Doe
   Email: john@example.com
   Phone: +381 66 123 4567
   Address: Street, City, Postal Code
   Notes: Special instructions...
   
   PHOTO DETAILS:
   ---
   Photo: photo1.jpg
   Format: 10x15 cm
   Quantity: 2
   Finish: Glossy
   ---
   Photo: photo2.jpg
   Format: 13x18 cm
   Quantity: 1
   Finish: Matte
   ---
   
   TOTAL PHOTOS: 3 prints
   ```
5. Create ZIP file containing all photos + order_details.txt
6. Store ZIP in `/app/backend/orders_zips/order-ORD-XXXXXX.zip`
7. Save order metadata to MongoDB (orders collection)

### 2. GET /api/orders/{order_number}
**Purpose**: Retrieve order details (for admin/tracking)

**Response**:
```json
{
  "orderNumber": "ORD-123456",
  "status": "pending|processing|completed",
  "createdAt": "2025-01-30T12:30:45Z",
  "contactInfo": {...},
  "photoSettings": [...],
  "zipFilePath": "/path/to/zip"
}
```

## MongoDB Schema

### Orders Collection
```python
{
  "_id": ObjectId,
  "orderNumber": "ORD-123456",
  "status": "pending",
  "createdAt": datetime,
  "contactInfo": {
    "fullName": str,
    "email": str,
    "phone": str,
    "address": str,
    "notes": str
  },
  "photoSettings": [
    {
      "fileName": str,
      "format": str,
      "quantity": int,
      "finish": str
    }
  ],
  "zipFilePath": str,
  "totalPhotos": int
}
```

## Frontend Integration Changes

### UploadPage.jsx - handleSubmit function
**Current (Mock)**:
```javascript
const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
localStorage.setItem('lastOrder', JSON.stringify({ orderNumber, photos, contactInfo }));
```

**New (Backend Integration)**:
```javascript
// Create FormData
const formData = new FormData();

// Add photos
photos.forEach(photo => {
  formData.append('photos', photo.file);
});

// Add order details
const orderDetails = {
  contactInfo,
  photoSettings: photos.map(p => ({
    fileName: p.file.name,
    format: p.format,
    quantity: p.quantity,
    finish: p.finish
  }))
};
formData.append('order_details', JSON.stringify(orderDetails));

// API call
const response = await axios.post(`${API}/orders/create`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

const { orderNumber } = response.data;
```

## File Structure
```
/app/backend/
├── server.py (main FastAPI app)
├── orders/ (order directories)
│   └── ORD-123456/
│       ├── photo1.jpg
│       ├── photo2.jpg
│       └── order_details.txt
├── orders_zips/ (final ZIP files)
│   └── order-ORD-123456.zip
└── utils/
    └── order_utils.py (helper functions for zip creation)
```

## Implementation Steps
1. Create order creation endpoint with file upload handling
2. Implement order number generation
3. Build ZIP file creation utility
4. Create order_details.txt formatter
5. Add MongoDB order storage
6. Update frontend to use real API
7. Add error handling and validation

## Error Handling
- Invalid file types → 400 Bad Request
- Missing required fields → 400 Bad Request
- File size too large → 413 Payload Too Large
- Server errors → 500 Internal Server Error

## Notes
- Photos are NOT resized on backend (as per requirements)
- ZIP file is the main deliverable for admin
- No payment processing (payment on delivery)
- No authentication required
