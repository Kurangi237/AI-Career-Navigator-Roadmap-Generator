# Security & Penetration Testing Checklist

## OWASP Top 10 Coverage

### 1. Injection (SQL Injection, Command Injection)
- ✅ Use Supabase ORM with parameterized queries
- ✅ No raw SQL queries in application code
- ✅ Input validation on all user inputs
- ✅ Prepared statements for all database operations

**Test Commands:**
```bash
# Test SQL injection
curl 'http://localhost:3000/api/problems/1\' OR 1=1--'
# Expected: 403 or normalized safe response

# Test command injection
curl -X POST 'http://localhost:3000/api/execute' \
  -d '{"code": "; rm -rf /;", "language": "javascript"}'
# Expected: Sanitized/rejected, operation fails safely
```

### 2. Broken Authentication
- ✅ JWT tokens with expiration (Supabase)
- ✅ Secure password hashing (bcrypt via Supabase)
- ✅ Session management with httpOnly cookies
- ✅ MFA ready (Supabase supports it)

**Tests:**
```bash
# Test expired token
curl -H 'Authorization: Bearer EXPIRED_TOKEN' \
  http://localhost:3000/api/user/profile
# Expected: 401 Unauthorized

# Test missing token
curl http://localhost:3000/api/user/profile
# Expected: 401 Unauthorized

# Test invalid signature
curl -H 'Authorization: Bearer INVALID_SIG' \
  http://localhost:3000/api/user/profile
# Expected: 401 Unauthorized
```

### 3. Sensitive Data Exposure
- ✅ HTTPS enforced (Railway/Vercel handles)
- ✅ Secrets in environment variables only
- ✅ No sensitive data in logs
- ✅ Database encryption at rest (Supabase)
- ✅ User data encryption in transit (TLS 1.2+)

**Verification:**
```bash
# Check HTTPS enforcement
curl -I https://yourapi.com/api/health
# Expected: Secure connection, HSTS header present

# Check for sensitive headers
curl -I https://yourapi.com/
# Expected: No X-Powered-By, Server headers exposed
```

### 4. XML External Entity (XXE)
- ✅ No XML parsing in application
- ✅ All file uploads validated
- ✅ YAML parsing with safe_load()

**Status:** Not applicable - application doesn't process XML

### 5. Broken Access Control
- ✅ Row-Level Security (RLS) on all tables
- ✅ Authorization checks on all endpoints
- ✅ Admin-only endpoints protected
- ✅ Users can only access own data

**Tests:**
```bash
# Test accessing another user's data
TOKEN_USER1="..." # User 1 token
TOKEN_USER2="..." # User 2 token

curl -H "Authorization: Bearer $TOKEN_USER1" \
  http://localhost:3000/api/users/user2/submissions
# Expected: 403 Forbidden

# Test admin-only endpoint
TOKEN_FREE_USER="..."
curl -H "Authorization: Bearer $TOKEN_FREE_USER" \
  http://localhost:3000/api/admin/users
# Expected: 403 Forbidden
```

### 6. Security Misconfiguration
- ✅ No default credentials
- ✅ Security headers configured (CSP, X-Frame-Options)
- ✅ CORS properly configured
- ✅ File uploads validated
- ✅ Error messages don't leak info

**Verification:**
```bash
# Check security headers
curl -I https://yourapi.com/
# Expected headers:
# - Content-Security-Policy
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Strict-Transport-Security

# Check CORS
curl -H 'Origin: http://evil.com' \
  -I https://yourapi.com/api/problems
# Expected: CORS not allowing evil.com
```

### 7. Cross-Site Scripting (XSS)
- ✅ React escapes by default
- ✅ DOMPurify on user-generated content
- ✅ Content-Security-Policy headers
- ✅ Sanitize discussion posts/replies

**Tests:**
```bash
# Test stored XSS via discussion
curl -X POST 'http://localhost:3000/api/discussions' \
  -H 'Content-Type: application/json' \
  -d '{
    "problem_id": "1",
    "title": "<script>alert(1)</script>",
    "content": "test"
  }'

# Then fetch and verify no script execution
curl 'http://localhost:3000/api/discussions/1'
# Expected: Script tags escaped or removed
```

### 8. Insecure Deserialization
- ✅ No pickle/marshal in Python code
- ✅ JSON only for data serialization
- ✅ Type validation on all inputs
- ✅ No eval() or Function() constructors

**Verification:**
```bash
# Check TypeScript compilation catches type issues
npm run type-check
# Expected: All types validated, no 'any' abuse
```

### 9. Using Components with Known Vulnerabilities
- ✅ Dependency scanning (npm audit)
- ✅ Renovate bot for updates
- ✅ Regular security updates

**Tests:**
```bash
# Check for vulnerable packages
npm audit
# Expected: No critical vulnerabilities

# Check specific packages
npm audit | grep -E "critical|high"
# Expected: None found

# Update lock files
npm install --save-dev npm-audit-ci
npm audit --audit-level=high
```

### 10. Insufficient Logging and Monitoring
- ✅ Sentry error tracking
- ✅ Datadog APM
- ✅ Request logging (timestamps, users, endpoints)
- ✅ Alert rules for suspicious activity

**Verification:**
```bash
# Check for proper logging
grep -r "console.log" src/ | wc -l
# Should use logger service, not console.log

# Check Sentry initialization
grep -r "Sentry.init" src/
# Expected: Found in server startup
```

---

## Additional Security Tests

### CSRF (Cross-Site Request Forgery)
- ✅ CSRF tokens on state-changing requests
- ✅ SameSite cookie attribute set
- ✅ Origin/Referer header validation

```bash
# Test CSRF protection
curl -X POST 'http://localhost:3000/api/discussions' \
  -H 'Origin: http://evil.com' \
  -H 'Content-Type: application/json' \
  -d '{"title": "hacked", "content": "bad"}'
# Expected: 403 Forbidden (CSRF token invalid)
```

### Rate Limiting
- ✅ 100 requests/minute per user
- ✅ 1000 requests/minute per IP
- ✅ Stricter limits on auth endpoints (5/minute)

```bash
# Test rate limiting
for i in {1..105}; do
  curl http://localhost:3000/api/problems
done
# Expected: 429 Too Many Requests after 100
```

### Password Policy
- ✅ Minimum 8 characters
- ✅ Require uppercase, lowercase, numbers
- ✅ No password in logs
- ✅ Password reset tokens expire in 1 hour

### API Key Security
- ✅ Keys rotated every 90 days
- ✅ Keys scoped to specific endpoints
- ✅ Keys logged with usage tracking

### Docker Security
- ✅ Non-root user in containers
- ✅ Read-only filesystems where possible
- ✅ Resource limits enforced
- ✅ Network policies restrict access

---

## Penetration Test Report Template

### Executive Summary
- Test Date: [DATE]
- Tested Server: [URL]
- Findings: [COUNT]
- Critical: [COUNT]
- High: [COUNT]
- Medium: [COUNT]
- Low: [COUNT]

### Vulnerabilities Found
1. [Vulnerability Name] - Severity: [LEVEL]
   - Description: [DETAILS]
   - CVSS Score: [CVSS]
   - Remediation: [FIX]

### Attestation
- [ ] All SQL queries use parameterized queries
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced on all endpoints
- [ ] Authentication required on protected endpoints
- [ ] Authorization checks before data access
- [ ] CORS properly configured
- [ ] Error messages sanitized
- [ ] Security headers present
- [ ] Rate limiting enforced
- [ ] Logging and monitoring active

---

## Continuous Security

### Pre-deployment Checks
```bash
# 1. Run type check
npm run type-check

# 2. Run security audit
npm audit --audit-level=high

# 3. Run SAST tools
npm install -g @snyk/cli
snyk test --severity-threshold=high

# 4. Check dependencies
npm ls | grep vulnerabilities

# 5. Lint code
npm run lint
```

### Post-deployment Checks
- [ ] Monitor Sentry for errors
- [ ] Check Datadog alerts
- [ ] Review access logs
- [ ] Verify SSL certificate validity
- [ ] Check firewall rules
- [ ] Test backup restoration
- [ ] Monitor resource usage

---

## Quarterly Security Review

- [ ] Update all dependencies
- [ ] Rotate API keys
- [ ] Review IAM policies
- [ ] Audit database access logs
- [ ] Test disaster recovery
- [ ] Review CVE databases
- [ ] Update security training
- [ ] Penetration test (annual)
