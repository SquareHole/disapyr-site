# disapyr.link Architecture Documentation

## System Overview

disapyr.link is a secure, serverless text-sharing application built with a zero-knowledge architecture. The system uses end-to-end encryption to ensure that sensitive data remains protected throughout its lifecycle, with automatic deletion after one-time access.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        UI[React/Next.js UI]
        WEB --> UI
    end
    
    subgraph "CDN/Edge Layer"
        NETLIFY[Netlify CDN]
        UI --> NETLIFY
    end
    
    subgraph "Application Layer"
        APP[Next.js App Router]
        PAGES[Pages & Components]
        NETLIFY --> APP
        APP --> PAGES
    end
    
    subgraph "API Layer"
        FN1[createSecret Function]
        FN2[getSecret Function]
        CRYPTO[Node.js Crypto Module]
        PAGES --> FN1
        PAGES --> FN2
        FN1 --> CRYPTO
        FN2 --> CRYPTO
    end
    
    subgraph "Database Layer"
        NEON[Neon PostgreSQL]
        SECRETS[secrets table]
        FN1 --> NEON
        FN2 --> NEON
        NEON --> SECRETS
    end
    
    subgraph "Security Layer"
        ENV[Environment Variables]
        ENCRYPTION[AES-256-GCM]
        SCRYPT[scrypt Key Derivation]
        CRYPTO --> ENCRYPTION
        CRYPTO --> SCRYPT
        ENV --> CRYPTO
    end
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend (Next.js)
    participant CDN as Netlify CDN
    participant CF as createSecret Function
    participant GF as getSecret Function
    participant DB as Neon Database
    participant Crypto as Encryption Layer
    
    Note over User, Crypto: Secret Creation Flow
    
    User->>UI: 1. Enter secret text + expiry
    UI->>CDN: 2. POST /createSecret
    CDN->>CF: 3. Route to function
    CF->>Crypto: 4. Generate UUID + IV
    CF->>Crypto: 5. Derive key with scrypt
    CF->>Crypto: 6. Encrypt with AES-256-GCM
    CF->>DB: 7. Store encrypted data
    DB-->>CF: 8. Confirm storage
    CF-->>CDN: 9. Return UUID key
    CDN-->>UI: 10. Return secret URL
    UI-->>User: 11. Display shareable link
    
    Note over User, Crypto: Secret Retrieval Flow
    
    User->>UI: 12. Access secret URL
    UI->>CDN: 13. GET /getSecret?key=uuid
    CDN->>GF: 14. Route to function
    GF->>DB: 15. Query by key
    DB-->>GF: 16. Return encrypted data
    GF->>Crypto: 17. Decrypt with AES-256-GCM
    GF->>DB: 18. Mark as retrieved + clear data
    DB-->>GF: 19. Confirm deletion
    GF-->>CDN: 20. Return plaintext
    CDN-->>UI: 21. Display secret
    UI-->>User: 22. Show secret (one-time only)
```

## Security Architecture

```mermaid
graph TD
    subgraph "Encryption Process"
        PT[Plaintext Secret]
        SALT[Static Salt: 'disapyr-salt']
        MASTERKEY[Master Encryption Key]
        SCRYPT[scrypt Key Derivation]
        DERIVEDKEY[Derived Key - 32 bytes]
        IV[Random IV - 16 bytes]
        AES[AES-256-GCM Cipher]
        ENCRYPTED[Encrypted Data]
        AUTHTAG[Authentication Tag]
        
        PT --> AES
        MASTERKEY --> SCRYPT
        SALT --> SCRYPT
        SCRYPT --> DERIVEDKEY
        DERIVEDKEY --> AES
        IV --> AES
        AES --> ENCRYPTED
        AES --> AUTHTAG
    end
    
    subgraph "Storage Format"
        JSON[JSON Object]
        ENCRYPTED --> JSON
        IV --> JSON
        AUTHTAG --> JSON
    end
    
    subgraph "Database Storage"
        DB[(Neon PostgreSQL)]
        SECRETS_TABLE[secrets table]
        JSON --> DB
        DB --> SECRETS_TABLE
    end
    
    subgraph "Decryption Process"
        RETRIEVE[Retrieve from DB]
        PARSE[Parse JSON]
        DECIPHER[AES-256-GCM Decipher]
        VERIFY[Verify Auth Tag]
        PLAINTEXT[Decrypted Plaintext]
        DELETE[Secure Deletion]
        
        SECRETS_TABLE --> RETRIEVE
        RETRIEVE --> PARSE
        PARSE --> DECIPHER
        DERIVEDKEY --> DECIPHER
        DECIPHER --> VERIFY
        VERIFY --> PLAINTEXT
        PLAINTEXT --> DELETE
    end
```

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        LAYOUT[layout.tsx - Root Layout]
        HOME[page.tsx - Home Page]
        SECRET["secret/[key]/page.tsx"]
        ABOUT[about/page.tsx]
        STYLES[CSS Modules + Globals]
        
        LAYOUT --> HOME
        LAYOUT --> SECRET
        LAYOUT --> ABOUT
        STYLES --> LAYOUT
    end
    
    subgraph "API Functions"
        CREATE[createSecret.js]
        GET[getSecret.js]
        NEONLIB["@netlify/neon"]
        NODECRPTO[Node.js crypto]
        
        CREATE --> NEONLIB
        CREATE --> NODECRPTO
        GET --> NEONLIB
        GET --> NODECRPTO
    end
    
    subgraph "Database Schema"
        TABLE[secrets table]
        COLS["
            id: SERIAL PRIMARY KEY
            key: UUID UNIQUE
            secret: TEXT - encrypted JSON
            retrieved_at: TIMESTAMP
            expires_at: TIMESTAMP
            created_at: TIMESTAMP
        "]
        TABLE --> COLS
    end
    
    HOME --> CREATE
    SECRET --> GET
    CREATE --> TABLE
    GET --> TABLE
```

## Deployment Architecture

```mermaid
graph LR
    subgraph "Development"
        DEV[Local Development]
        DEVENV[.env.local]
        DEV --> DEVENV
    end
    
    subgraph "Source Control"
        GIT[Git Repository]
        DEV --> GIT
    end
    
    subgraph "CI/CD"
        NETLIFY_BUILD[Netlify Build]
        GIT --> NETLIFY_BUILD
    end
    
    subgraph "Production Environment"
        NETLIFY_CDN[Netlify CDN]
        NETLIFY_FUNCTIONS[Netlify Functions]
        NETLIFY_ENV[Environment Variables]
        
        NETLIFY_BUILD --> NETLIFY_CDN
        NETLIFY_BUILD --> NETLIFY_FUNCTIONS
        NETLIFY_ENV --> NETLIFY_FUNCTIONS
    end
    
    subgraph "External Services"
        NEON_DB[Neon PostgreSQL]
        NETLIFY_FUNCTIONS --> NEON_DB
    end
    
    subgraph "End Users"
        BROWSER[Web Browsers]
        NETLIFY_CDN --> BROWSER
    end
```

## Security Layers

```mermaid
graph TD
    subgraph "Application Security"
        INPUT[Input Validation]
        SANITIZE[Data Sanitization]
        RATELIMIT[Rate Limiting]
        HTTPS[HTTPS/TLS]
    end
    
    subgraph "Encryption Security"
        KEYDERIV[Key Derivation - scrypt]
        AESENC[AES-256-GCM Encryption]
        AUTHENC[Authenticated Encryption]
        RANDIV[Random IV per Secret]
    end
    
    subgraph "Storage Security"
        ZEROK[Zero Knowledge Design]
        ONETIME[One-time Access]
        AUTOEXP[Auto Expiration]
        SECDEL[Secure Deletion]
    end
    
    subgraph "Infrastructure Security"
        ENVVAR[Environment Variables]
        NETLIFY[Netlify Security]
        NEONDB[Neon Database Security]
        CDN[CDN Protection]
    end
    
    INPUT --> KEYDERIV
    SANITIZE --> AESENC
    AESENC --> ZEROK
    AUTHENC --> ONETIME
    RANDIV --> AUTOEXP
    ZEROK --> ENVVAR
    ONETIME --> NETLIFY
    AUTOEXP --> NEONDB
    SECDEL --> CDN
```

## Key Architectural Decisions

### 1. **Serverless Architecture**
- **Choice**: Netlify Functions for API endpoints
- **Rationale**: Automatic scaling, reduced operational overhead, pay-per-use model
- **Trade-offs**: Cold start latency, vendor lock-in

### 2. **Zero-Knowledge Design**
- **Choice**: Client-side URL generation, server-side encryption
- **Rationale**: Service provider cannot access plaintext secrets
- **Implementation**: Encryption keys stored separately from database

### 3. **One-Time Access Pattern**
- **Choice**: Immediate deletion after retrieval
- **Rationale**: Prevents replay attacks and accidental exposure
- **Implementation**: Database UPDATE with NULL overwrite

### 4. **AES-256-GCM Encryption**
- **Choice**: Authenticated encryption with associated data (AEAD)
- **Rationale**: Provides both confidentiality and authenticity
- **Implementation**: Unique IV per secret, scrypt key derivation

### 5. **React/Next.js Frontend**
- **Choice**: Modern React with App Router
- **Rationale**: Type safety, SSR capability, developer experience
- **Implementation**: CSS Modules for styling, TypeScript for type safety

## Performance Considerations

### Frontend Optimization
- Next.js automatic code splitting
- CSS Modules for scoped styling
- Responsive images and assets
- Progressive Web App capabilities

### Backend Optimization
- Serverless functions for auto-scaling
- Database connection pooling via Neon
- Minimal data transfer (encrypted JSON only)
- Efficient database queries with indexes

### Security vs Performance Trade-offs
- scrypt key derivation adds computational cost but improves security
- AES-256-GCM provides authenticated encryption with minimal overhead
- One-time access requires immediate database updates but ensures security

## Monitoring and Observability

```mermaid
graph LR
    subgraph "Application Metrics"
        PERF[Performance Metrics]
        ERROR[Error Tracking]
        USAGE[Usage Analytics]
    end
    
    subgraph "Infrastructure Metrics"
        NETLIFY_METRICS[Netlify Analytics]
        FUNCTION_METRICS[Function Performance]
        DB_METRICS[Database Metrics]
    end
    
    subgraph "Security Monitoring"
        FAILED_ACCESS[Failed Access Attempts]
        RATE_LIMITING[Rate Limit Violations]
        ENCRYPTION_ERRORS[Encryption Failures]
    end
    
    PERF --> NETLIFY_METRICS
    ERROR --> FUNCTION_METRICS
    USAGE --> DB_METRICS
    FAILED_ACCESS --> RATE_LIMITING
    RATE_LIMITING --> ENCRYPTION_ERRORS
```

## Scalability Considerations

### Horizontal Scaling
- Serverless functions auto-scale based on demand
- CDN distribution for global performance
- Database connection pooling for concurrent access

### Vertical Scaling
- Neon PostgreSQL auto-scaling capabilities
- Function memory allocation optimization
- Database query optimization

### Growth Planning
- Monitor function execution times
- Database storage and connection limits
- CDN bandwidth usage
- Rate limiting thresholds

---

## Security Best Practices Implemented

1. **Encryption at Rest**: All secrets encrypted before database storage
2. **Encryption in Transit**: HTTPS/TLS for all communications
3. **Key Management**: Environment-based key storage, separate from data
4. **Access Control**: One-time access with immediate deletion
5. **Input Validation**: Length limits, sanitization, type checking
6. **Error Handling**: No information leakage in error responses
7. **Audit Trail**: Timestamps and access logging
8. **Secure Deletion**: Overwrite with NULL values after access

This architecture ensures a secure, scalable, and maintainable text-sharing service with strong privacy guarantees.
