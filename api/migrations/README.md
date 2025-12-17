# Database Migration - Property Verification

## Purpose
This migration updates all existing listings to be verified and public by default, ensuring they remain visible after the verification system is deployed.

## When to Run
**BEFORE** deploying the property verification system to production.

## How to Run

### Option 1: Using Node (Recommended)
```bash
cd api
node migrations/migrateListingVerification.js
```

### Option 2: Using npm script
Add to `package.json` scripts:
```json
"migrate:verification": "node migrations/migrateListingVerification.js"
```

Then run:
```bash
cd api
npm run migrate:verification
```

## What It Does

1. Connects to your MongoDB database
2. Finds all listings without `isVerified` or `visibility` fields
3. Updates them to:
   - `isVerified: true`
   - `visibility: 'public'`
4. Shows migration statistics
5. Disconnects from database

## Expected Output

```
🔄 Starting database migration for property verification...
✅ Connected to database
📊 Found 150 listings to migrate
✅ Migration completed successfully!
   - Matched: 150 listings
   - Modified: 150 listings
   - Acknowledged: true

📈 Post-Migration Statistics:
   - Total Listings: 150
   - Verified Listings: 150
   - Public Listings: 150
   - Unverified Listings: 0
   - Private Listings: 0

✅ Database disconnected
🎉 Migration completed successfully!
```

## Verification

After running the migration, verify in MongoDB:

```javascript
// Check all listings have the new fields
db.listings.find({
  $or: [
    { isVerified: { $exists: false } },
    { visibility: { $exists: false } }
  ]
}).count()
// Should return: 0

// Check all existing listings are verified
db.listings.find({ isVerified: true }).count()
// Should return: total count of listings
```

## Rollback

If you need to rollback (remove the new fields):

```javascript
db.listings.updateMany(
  {},
  {
    $unset: {
      isVerified: "",
      visibility: "",
      verificationId: ""
    }
  }
)
```

## Safety

- ✅ Non-destructive: Only adds/updates fields
- ✅ Idempotent: Safe to run multiple times
- ✅ No data loss: Preserves all existing data
- ✅ Reversible: Can be rolled back if needed

## Troubleshooting

### Error: "Cannot connect to database"
- Check your `.env` file has correct `MONGO_URI`
- Ensure MongoDB is running
- Check network connectivity

### Error: "Module not found"
- Run `npm install` in the `api` directory
- Ensure you're in the correct directory

### Migration shows 0 listings
- This is normal if:
  - Migration was already run
  - All listings already have the fields
  - Database is empty

## Post-Migration

After successful migration:
1. ✅ Deploy the updated code
2. ✅ Test property creation flow
3. ✅ Test verification workflow
4. ✅ Monitor for any issues

## Important Notes

⚠️ **Run this BEFORE deploying** the verification system
⚠️ **Backup your database** before running (recommended)
⚠️ **Test in staging** environment first

## Questions?

If you encounter any issues, check:
1. Database connection string
2. Node.js version (should be 14+)
3. MongoDB version (should be 4.4+)
