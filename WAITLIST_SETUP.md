# Waitlist Feature Documentation

## Overview
The waitlist feature allows users to sign up for early access to the web version of Base Jump by connecting their wallet and providing their name. The app supports multiple wallet connection methods and ensures users are on the Base blockchain.

## Features Implemented

### 1. **Frontend (components/pages/app.tsx)**
- "Web Version Coming Soon" message with call-to-action
- Multiple wallet connection options:
  - **MetaMask** (browser extension)
  - **WalletConnect** (mobile wallets & more)
- Base chain validation and automatic switching
- Name input field (appears after wallet connection)
- Join Waitlist button
- Success state with confirmation message
- Error handling and validation
- Loading states
- Network switching UI

### 2. **Backend API (app/api/waitlist/route.ts)**

#### POST /api/waitlist
**Purpose:** Add a user to the waitlist

**Request Body:**
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "name": "John Doe"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Successfully joined the waitlist",
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "name": "John Doe",
    "joinedAt": "2025-10-12T10:30:00.000Z"
  }
}
```

**Response (Error - 400/409/500):**
```json
{
  "error": "Error message"
}
```

**Validations:**
- Wallet address must be valid Ethereum format (0x + 40 hex characters)
- Name must be between 2-100 characters
- Duplicate addresses are not allowed (409 error)

#### GET /api/waitlist
**Purpose:** Check if an address is on the waitlist or get total count

**Query Parameters:**
- `address` (optional): Check if specific address exists

**Examples:**
```
GET /api/waitlist
Response: { "count": 42 }

GET /api/waitlist?address=0x1234...
Response: { "exists": true, "address": "0x1234..." }
```

## Database Schema

**Database:** `basejump`  
**Collection:** `waitlist`

**Document Structure:**
```javascript
{
  _id: ObjectId,
  address: String,        // Lowercase Ethereum address
  name: String,          // User's name (trimmed)
  joinedAt: Date,        // Timestamp when joined
  ipAddress: String,     // User's IP (for analytics/spam prevention)
  userAgent: String      // Browser info (for analytics)
}
```

**Indexes:**
The collection automatically creates an index on `address` for duplicate checking.

### Creating Index Manually (Optional)
```javascript
db.waitlist.createIndex({ address: 1 }, { unique: true })
db.waitlist.createIndex({ joinedAt: -1 })
```

## Environment Variables Required

Make sure you have the following in your `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
```

## Wallet Configuration

### Supported Wallets
The app is configured with the following connectors:
1. **Injected Wallet** (MetaMask, Coinbase Wallet, etc.)
2. **WalletConnect** (All WalletConnect-compatible wallets)
3. **Farcaster Mini App** (When running in Farcaster)

### Base Chain Requirement
- The app **ONLY** works with Base blockchain (Chain ID: 8453)
- If a user connects on the wrong network, they'll see a warning message
- One-click "Switch to Base" button for easy network switching
- Submit button is disabled until user is on Base chain

### Wallet Provider Configuration
Located in `components/wallet-provider.tsx`:
```typescript
chains: [base]  // Only Base chain is configured
transports: {
  [base.id]: http()
}
```

## User Flow

1. User lands on page when Farcaster SDK is not loaded
2. See "Web Version Coming Soon" message
3. Click "Connect Wallet to Join Waitlist"
4. Choose wallet option (MetaMask or WalletConnect)
5. **MetaMask**: Browser extension popup appears
   - User approves connection
   - If on wrong network, prompted to switch to Base
6. **WalletConnect**: QR code modal opens
   - User scans QR with mobile wallet
   - Connects to Base network
7. Name input field appears after successful connection
8. If on wrong network, warning banner appears with "Switch to Base" button
9. User enters their name
10. Click "Join Waitlist" button (only enabled when on Base chain)
11. Success message appears with confirmation
12. User can disconnect wallet

## Admin/Management

### View All Waitlist Entries
```javascript
// Using MongoDB Compass or CLI
db.waitlist.find().sort({ joinedAt: -1 })
```

### Export to CSV
```javascript
// Using MongoDB CLI
mongoexport --uri="your_mongodb_uri" --db=basejump --collection=waitlist --type=csv --fields=address,name,joinedAt --out=waitlist.csv
```

### Count Total Entries
```javascript
db.waitlist.countDocuments()
```

### Find Duplicates (shouldn't exist due to validation)
```javascript
db.waitlist.aggregate([
  { $group: { _id: "$address", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

### Recent Sign-ups (last 7 days)
```javascript
db.waitlist.find({
  joinedAt: { 
    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
  }
}).sort({ joinedAt: -1 })
```

## Testing

### Manual Testing
1. Start your development server: `pnpm dev`
2. Visit the root page
3. If Farcaster SDK doesn't load, you'll see the waitlist
4. Test wallet connection
5. Test form submission
6. Check MongoDB to verify entry was created

### API Testing with cURL
```bash
# Add to waitlist
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "name": "Test User"
  }'

# Check if address exists
curl "http://localhost:3000/api/waitlist?address=0x1234567890123456789012345678901234567890"

# Get total count
curl http://localhost:3000/api/waitlist
```

## Security Considerations

- ✅ Input validation on both frontend and backend
- ✅ Duplicate prevention
- ✅ IP address logging for spam prevention
- ✅ Name length limits
- ✅ Wallet address format validation
- ✅ Error messages don't expose sensitive information

## Future Enhancements

Consider adding:
- Email collection (optional)
- Social media links
- Notification system when web version launches
- Admin dashboard to view/export waitlist
- Analytics tracking
- Email verification
- Referral system
- Priority tiers based on early sign-up

## Troubleshooting

### "Internal server error" when submitting
- Check MongoDB connection string in `.env.local`
- Verify MongoDB database is accessible
- Check server logs for detailed error

### "Invalid wallet address format"
- Ensure wallet is properly connected
- Address should be 42 characters (0x + 40 hex)

### "This wallet address is already on the waitlist"
- Address has already signed up
- This is expected behavior to prevent duplicates

## Support

For issues or questions, check:
1. MongoDB connection logs
2. Browser console for frontend errors
3. Server logs for API errors
4. Network tab to inspect API requests/responses

