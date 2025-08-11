# disapyr.link

**A secure, one-time text sharing service with military-grade encryption**

[![Netlify Status](https://api.netlify.com/api/v1/badges/82fe5400-4c6f-4e16-b3d9-9295164144f9/deploy-status)](https://app.netlify.com/projects/disapyr-link/deploys)

## 🔒 What is disapyr.link?

disapyr.link is a secure text sharing service that allows you to share sensitive information through self-destructing, encrypted links. Perfect for sharing passwords, API keys, confidential notes, or any sensitive text that should only be viewed once.

### Key Features

**🔐 Military-Grade Encryption**: AES-256-GCM encryption with unique initialization vectors
**👁️ One-Time Access**: Secrets are deleted after being viewed once (content is nulled and access is blocked)
**⏰ Automatic Expiration**: Configurable expiration (1-365 days, default 21 days)
**🚫 Zero Knowledge**: We cannot read your secrets - they're encrypted before storage
**📱 Mobile Friendly**: Responsive design works on all devices
**🌙 Dark/Light Mode**: Beautiful dark/light theme support using CSS custom properties in `globals.css`
**⚡ Quick-Pick Expiry Chips**: Easily select 7/14/21/30 day expiry with a single click
**♿ Accessibility Enhancements**: ARIA live regions, focus management, and reduced-motion support

## 🚀 Live Demo

Visit [disapyr.link](https://disapyr.link) to try it out!

## 🛠️ Technology Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **CSS Modules** - Scoped styling with custom properties
- **React 19** - Modern React features

### Backend
- **Netlify Functions** - Serverless API endpoints
- **Neon Postgres** - Cloud-hosted PostgreSQL database
- **Node.js Crypto** - Built-in encryption/decryption

#### Rate Limiting
- Per-IP rate limiting is enforced for all API functions using `site/netlify/functions/_lib/rateLimit.js`.

### Security
- **AES-256-GCM** encryption algorithm
- **scrypt** key derivation function
- **Secure deletion** after retrieval (content nullified; minimal access metadata retained)
- **Environment-based encryption keys**
- **Rate limiting** on API functions (per-IP fixed window)

## 🏗️ Project Structure

```
├── site/
│   ├── app/
│   │   ├── page.tsx              # Main landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── about/
│   │   │   └── page.tsx          # Security information page
│   │   └── secret/[key]/
│   │       └── page.tsx          # Secret viewing page
│   ├── netlify/functions/
│   │   ├── createSecret.js       # API: Create encrypted secret
│   │   ├── getSecret.js          # API: Retrieve and soft-delete (null content)
│   │   └── cleanupExpired.js     # Scheduled cleanup of expired/old rows
│   ├── package.json
│   └── next.config.ts
├── netlify.toml                  # Netlify configuration
└── README.md
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Netlify account (for deployment)
- Neon database (for production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/disapyr-site.git
   cd disapyr-site/site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `site/.env.local`:
   ```bash
   NETLIFY_ENCRYPTION_KEY=your-64-character-encryption-key
   NETLIFY_DATABASE_URL=your-neon-database-connection-string
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

### Database Setup

The application requires a PostgreSQL table with the following schema:

```sql
CREATE TABLE secrets (
   id SERIAL PRIMARY KEY, -- Optional: some environments may not have this column
   key UUID UNIQUE NOT NULL,
   secret TEXT,
   retrieved_at TIMESTAMP,
   expires_at TIMESTAMP NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

**Note:** The codebase always prefers `key` (UUID) for lookups. Some environments may not have an `id` column; ensure your cleanup and retrieval logic does not depend on `id`.
```

## 🚀 Deployment

### Netlify Deployment

1. **Fork/clone this repository**

2. **Connect to Netlify**
   - Import your repository in Netlify
   - Set build directory to `site`
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Configure environment variables**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   NETLIFY_ENCRYPTION_KEY=your-64-character-encryption-key
   NETLIFY_DATABASE_URL=your-neon-database-connection-string
   ```

4. **Deploy**
   - Netlify will automatically deploy on git push
   - Functions will be available at `/.netlify/functions/`
   - Security headers are copied from `public/_headers` into the publish dir via the build command
   - CSP is set dynamically via Next.js middleware (single source of truth)

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NETLIFY_ENCRYPTION_KEY` | 64-character hex string for AES encryption | Yes |
| `NETLIFY_DATABASE_URL` | Neon PostgreSQL connection string | Yes |

## 🔐 Security Implementation

### Encryption Process

1. **Text Input**: User enters sensitive text
2. **Key Derivation**: scrypt derives encryption key from master key + salt
3. **Encryption**: AES-256-GCM encrypts text with unique IV
4. **Storage**: Only encrypted data stored in database
5. **Retrieval**: Text decrypted on-demand and immediately deleted (soft-delete: content set to NULL, access blocked)

### Security Features

- **Zero Knowledge Architecture**: Server cannot read plaintext secrets
- **Perfect Forward Secrecy**: Each secret uses unique encryption parameters
- **Secure Deletion**: Overwritten with NULL after retrieval; minimal metadata (timestamps) may remain briefly for abuse prevention and cleanup

- **Theming**: All styling uses CSS custom properties for dark/light mode in `site/app/globals.css`.
- **UI/UX**: Quick-pick expiry chips, accessible focus states, and responsive design are implemented throughout the frontend.

### Scheduled Cleanup

This project includes an automated cleanup task to remove stale data:

- Deletes rows where `expires_at < now()`
- Deletes rows with `retrieved_at` older than 7 days

**Implementation note:** The cleanup function (`site/netlify/functions/cleanupExpired.js`) uses `RETURNING 1` in SQL to count deleted rows, avoiding schema mismatches if `id` is not present.

You can configure scheduling either in code (see `site/netlify/functions/cleanupExpired.js` with `export const config = { schedule: '@hourly' }`) or via `site/netlify.toml` using `[[scheduled.functions]]` with a cron expression.
- **Time-based Expiration**: Automatic cleanup of expired secrets
- **Input Validation**: Length limits and sanitization
- **Error Handling**: No information leakage in error messages

## 📝 API Documentation

### Create Secret
```
POST /.netlify/functions/createSecret
Content-Type: application/json

{
  "secret": "Your sensitive text here",
  "expiryDays": 21
}
```

**Response:**
```json
{
  "key": "uuid-v4-key",
  "expires_at": "2024-01-15T10:30:00Z",
  "message": "Secret created successfully"
}
```

### Retrieve Secret
```
GET /.netlify/functions/getSecret?key=uuid-v4-key
```

**Response:**
```json
{
  "key": "uuid-v4-key",
  "secret": "Your sensitive text here",
  "retrieved_at": "2024-01-01T10:30:00Z"
}
```

### Rate Limiting

To protect against abuse, the API enforces per-IP fixed-window limits:

- Create: up to 10 requests per 5 minutes
- Get: up to 60 requests per 5 minutes

Responses include standard headers:

- `X-RateLimit-Limit`: allowed requests in the window
- `X-RateLimit-Remaining`: remaining requests
- `X-RateLimit-Reset`: epoch seconds when the window resets

When exceeded, the API returns HTTP 429 with a minimal body:

```json
{ "error": "Too many requests" }
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -am 'Add feature'`
6. Push: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🛡️ Security

If you discover a security vulnerability, please send an email to security@disapyr.link instead of creating a public issue.

## 📞 Support

- **Documentation**: Check the `/about` page for detailed security information
- **Issues**: Create an issue on GitHub for bug reports
- **Questions**: Discussion tab for general questions

---

**Built with ❤️ for secure communication**