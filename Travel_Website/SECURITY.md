# Security Practices

## Authentication System
- Uses HTTP-only cookies for JWT storage
- Server-side session validation
- Password strength enforcement
- Rate limiting (5 attempts/15 minutes)

## Best Practices
1. Always use:
```javascript
credentials: 'include' 
```
for auth-related fetch requests

2. Session verification required for all protected routes:
```javascript
await checkAuth();
```

3. Password requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

## Monitoring
Check logs for:
- Failed login attempts
- Password reset requests
- Account lockouts

## Reporting Vulnerabilities
Email security@tourista.com with details
