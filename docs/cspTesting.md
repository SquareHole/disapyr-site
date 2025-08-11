# Content Security Policy Testing Instructions

## What We've Implemented

I've implemented a strict Content Security Policy (CSP) that eliminates the need for `unsafe-inline` by using nonces. Here's what was changed:

### 1. Created Middleware (`site/middleware.ts`)
- Generates a unique nonce for each request using Web Crypto API (Edge Runtime compatible)
- Sets a strict CSP header with the nonce
- Allows only external stylesheets and nonce-approved inline styles/scripts

### 2. Simplified Layout (`site/app/layout.tsx`)
- Removed Google Fonts (which required `unsafe-inline`)
- Now uses system fonts defined in `globals.css`
- Cleaner, more secure implementation

### 3. Updated Next.js Config (`site/next.config.ts`)
- Removed CSP from headers (now handled by middleware)
- Kept X-Frame-Options for additional security

## Current CSP Policy
```
default-src 'self';
script-src 'self' 'nonce-[random]' 'strict-dynamic';
style-src 'self' 'nonce-[random]';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

## Testing Steps

1. **Start the development server:**
   ```bash
   cd site
   npm run dev
   ```

2. **Open browser developer tools** and navigate to your site

3. **Check the Network tab** - you should see the CSP header in the response

4. **Check the Console tab** - there should be no CSP violations

5. **Test functionality:**
   - Create a secret link
   - Copy the link
   - Visit the secret page
   - All features should work without CSP errors

## Benefits of This Approach

- ✅ **No `unsafe-inline`** - Much more secure
- ✅ **Nonce-based** - Each request gets a unique nonce
- ✅ **Strict Dynamic** - Scripts can only load other scripts dynamically
- ✅ **System Fonts** - No external font dependencies
- ✅ **Minimal Attack Surface** - Very restrictive policy

## If You Want to Add Google Fonts Back

If you want to use Google Fonts again, you would need to:

1. Add `https://fonts.googleapis.com` to `style-src`
2. Add `https://fonts.gstatic.com` to `font-src`
3. But this would still be secure without `unsafe-inline`

The current implementation prioritizes maximum security over custom fonts.
