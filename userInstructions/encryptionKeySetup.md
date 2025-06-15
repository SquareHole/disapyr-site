# Encryption Key Setup

## Generated Encryption Key

Your secure 64-character encryption key has been generated:

```
9995da3f87ecd7f84d44043bb7b151dc02665cee11734153ff7bfcb47f8e8cff
```

## Environment Variable Setup

### In Netlify Dashboard:
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add the following environment variable:
   - **Key**: `NETLIFY_ENCRYPTION_KEY`
   - **Value**: `9995da3f87ecd7f84d44043bb7b151dc02665cee11734153ff7bfcb47f8e8cff`

### For Local Development:
Add this to your `.env.local` file in the `site/` directory:
```
NETLIFY_ENCRYPTION_KEY=9995da3f87ecd7f84d44043bb7b151dc02665cee11734153ff7bfcb47f8e8cff
```

## Security Notes

1. **Keep this key secure** - Anyone with this key can decrypt your secrets
2. **Never commit this key to version control** - Add `.env.local` to your `.gitignore`
3. **Backup this key securely** - If lost, all encrypted secrets become unrecoverable
4. **Use different keys** for development and production environments
5. **Rotate this key periodically** for enhanced security

## Testing the Fix

After setting up the environment variable:

1. Deploy your changes to Netlify
2. Test creating a new secret
3. Test retrieving the secret
4. Verify that the secret is cleared from the database after retrieval

The encryption error should now be resolved with the updated `createCipheriv` and `createDecipheriv` functions.
