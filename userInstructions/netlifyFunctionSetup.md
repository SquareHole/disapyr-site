# Netlify Function Setup for Database Connection

## Environment Variable Setup

To connect your Netlify function to your Neon Postgres database, you need to set up the `NETLIFY_DATABASE_URL` environment variable.

### In Netlify Dashboard:
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add a new environment variable:
   - **Key**: `NETLIFY_DATABASE_URL`
   - **Value**: Your Neon database connection string (should look like: `postgresql://username:password@host/database`)

### For Local Development:
Create a `.env.local` file in the `site/` directory:
```
NETLIFY_DATABASE_URL=postgresql://username:password@host/database
```

## Function Usage

### Get Secret Function
The function is accessible at: `/.netlify/functions/getSecret`

#### API Endpoint:
```
GET /.netlify/functions/getSecret?key=YOUR_SECRET_KEY
```

### Create Secret Function
The function is accessible at: `/.netlify/functions/createSecret`

#### API Endpoint:
```
POST /.netlify/functions/createSecret
Content-Type: application/json

{
  "secret": "Your secret text here"
}
```

### Response Examples:

#### Get Secret Responses:

**Success (200):**
```json
{
  "key": "your-secret-key",
  "secret": "your-secret-content",
  "retrieved_at": "2025-06-15T17:20:00.000Z"
}
```

**Secret not found or already retrieved (404):**
```json
{
  "error": "Secret not found or already retrieved"
}
```

**Secret expired (410):**
```json
{
  "error": "Secret has expired"
}
```

**Missing key parameter (400):**
```json
{
  "error": "Key parameter is required"
}
```

#### Create Secret Responses:

**Success (201):**
```json
{
  "key": "generated-uuid-key",
  "expires_at": "2025-07-06T17:20:00.000Z",
  "message": "Secret created successfully"
}
```

**Missing secret text (400):**
```json
{
  "error": "Secret text is required"
}
```

**Secret too long (400):**
```json
{
  "error": "Secret text too long (max 10000 characters)"
}
```

**Method not allowed (405):**
```json
{
  "error": "Method not allowed"
}
```

**Internal server error (500):**
```json
{
  "error": "Internal server error"
}
```

## Function Behavior

1. **Retrieval Logic**: Only retrieves secrets where `retrieved_at` is NULL
2. **Expiration Check**: Automatically checks if the secret has expired based on `expires_at`
3. **Timestamp Update**: Updates `retrieved_at` to current timestamp when accessed
4. **One-time Access**: Once retrieved, the secret cannot be accessed again (retrieved_at is no longer NULL)

## Testing

### Local Testing with Netlify CLI:
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run locally: `netlify dev` (from the project root)
3. Test the function: `curl "http://localhost:8888/.netlify/functions/getSecret?key=test-key"`

### Production Testing:
Once deployed, test with:
```bash
curl "https://your-site.netlify.app/.netlify/functions/getSecret?key=test-key"
```

## Database Requirements

Make sure your Neon database has:
1. The `secrets` table created with the correct schema
2. Test data inserted for testing
3. The connection string properly configured in environment variables

## Next Steps

1. Set up the `NETLIFY_DATABASE_URL` environment variable
2. Deploy to Netlify
3. Test the function with a known secret key
4. Verify the database connection and functionality
