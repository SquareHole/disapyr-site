# Netlify Function Setup for Database Connection

## Environment Variable Setup

To connect your Netlify function to your Neon Postgres database and enable encryption, you need to set up the following environment variables.

### In Netlify Dashboard:
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add the following environment variables:
   - **Key**: `NETLIFY_DATABASE_URL`
   - **Value**: Your Neon database connection string (should look like: `postgresql://username:password@host/database`)
   - **Key**: `NETLIFY_ENCRYPTION_KEY`
   - **Value**: A strong encryption key (minimum 32 characters, use a random string generator)

### For Local Development:
Create a `.env.local` file in the `site/` directory:
```
NETLIFY_DATABASE_URL=postgresql://username:password@host/database
NETLIFY_ENCRYPTION_KEY=your-strong-encryption-key-here-minimum-32-chars
```

### Generating an Encryption Key:
You can generate a secure encryption key using:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
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

1. **Encryption**: All secrets are encrypted using AES-256-GCM before storage
2. **Retrieval Logic**: Only retrieves secrets where `retrieved_at` is NULL and secret content exists
3. **Expiration Check**: Automatically checks if the secret has expired based on `expires_at`
4. **Decryption**: Secrets are decrypted during retrieval using the encryption key
5. **Timestamp Update**: Updates `retrieved_at` to current timestamp when accessed
6. **Secret Clearing**: Secret content is permanently deleted from database after retrieval
7. **One-time Access**: Once retrieved, the secret cannot be accessed again (content is NULL)

## Security Features

### Encryption at Rest
- Secrets are encrypted using AES-256-GCM encryption before being stored in the database
- Each secret uses a unique initialization vector (IV) for maximum security
- Encryption key is stored separately in environment variables, not in the database

### Secure Deletion
- After a secret is retrieved, the encrypted content is permanently deleted from the database
- Only metadata (key, timestamps) remains, making the secret completely inaccessible
- Even direct database access cannot reveal secret content after retrieval

### Key Derivation
- Encryption keys are derived using scrypt with a salt for additional security
- This prevents rainbow table attacks and adds computational cost to brute force attempts

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
