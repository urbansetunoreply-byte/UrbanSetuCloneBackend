# Deployment Notes

## Image Favorites Feature

### Setup Requirements

When deploying or setting up the project for the first time, make sure to:

1. **Install Dependencies**: Run `npm install` in the root directory to install all backend dependencies
2. **Install Client Dependencies**: Run `npm install` in the `client/` directory for frontend dependencies
3. **Restart Server**: After installing dependencies, restart the API server to ensure all routes are properly registered

### API Endpoints

The image favorites feature adds the following API endpoints:

- `GET /api/image-favorites/user/:userId` - Get user's favorites
- `POST /api/image-favorites/add` - Add image to favorites
- `DELETE /api/image-favorites/remove/:imageId` - Remove image from favorites
- `GET /api/image-favorites/check/:imageId` - Check if image is favorited
- `GET /api/image-favorites/count` - Get favorites count
- `POST /api/image-favorites/bulk/add` - Bulk add favorites
- `POST /api/image-favorites/bulk/remove` - Bulk remove favorites

### Troubleshooting

**405 Method Not Allowed Error**: 
- This usually indicates that dependencies aren't properly installed
- Run `npm install` in the root directory
- Restart the API server with `npm start`

**Authentication Required**:
- All favorites endpoints require user authentication
- Make sure the user is logged in and cookies are being sent with requests

### Database

The feature uses a new `ImageFavorite` collection with the following schema:
- `userId` (ObjectId, ref: User)
- `imageUrl` (String)
- `imageId` (String, unique per user)
- `listingId` (ObjectId, ref: Listing, optional)
- `metadata` (Object with image details)
- `addedAt` (Date)

Indexes are created for performance on `userId + imageId` (unique) and `userId + addedAt`.