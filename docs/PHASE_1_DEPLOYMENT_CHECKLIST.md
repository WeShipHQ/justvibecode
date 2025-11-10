# Phase 1: Deployment Checklist

Use this checklist to ensure Phase 1 is properly deployed to production.

---

## Pre-Deployment Checklist

### Environment Setup

- [ ] PostgreSQL database provisioned and accessible
- [ ] `DATABASE_URL` set in production environment variables
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` configured
- [ ] Database connection tested from production environment
- [ ] Backup strategy configured for database
- [ ] Database credentials secured (not in source control)

### Code Review

- [ ] All Phase 1 code merged to main branch
- [ ] Database schema reviewed and approved
- [ ] Service layer methods tested
- [ ] API endpoints security reviewed
- [ ] Auth middleware implementation verified
- [ ] Frontend integration tested

### Testing

- [ ] Local test script passes (`npx tsx scripts/test-auth-flow.ts`)
- [ ] Manual testing completed with real wallet
- [ ] Session persistence verified across page reloads
- [ ] Logout flow tested
- [ ] Multi-wallet scenario tested
- [ ] Error handling verified

---

## Deployment Steps

### 1. Database Migration

```bash
# In production environment
npm run db:migrate
```

**Verification:**

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('User', 'Wallet', 'Session');

-- Should return 3 tables
```

- [ ] Migration completed without errors
- [ ] All tables created successfully
- [ ] Indexes created on appropriate columns

### 2. Application Deployment

```bash
# Build application
npm run build

# Start production server
npm start
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing dependencies
- [ ] Application starts successfully

### 3. Environment Variables

Verify in production:

- [ ] `DATABASE_URL` is set and correct
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` is set
- [ ] No sensitive data in client-side env vars
- [ ] All required Privy config present

---

## Post-Deployment Verification

### Functional Testing

#### 1. User Registration

- [ ] Open application in browser
- [ ] Click "Connect Wallet"
- [ ] Select wallet (Phantom/Solflare/Backpack)
- [ ] Sign authentication message
- [ ] User profile appears
- [ ] Verify user in database:
  ```sql
  SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 5;
  ```

#### 2. Session Persistence

- [ ] Connect wallet and authenticate
- [ ] Refresh page
- [ ] User remains authenticated
- [ ] Verify session in database:
  ```sql
  SELECT * FROM "Session" WHERE "expiresAt" > NOW();
  ```

#### 3. Profile Updates

- [ ] Update display name
- [ ] Change avatar (if implemented)
- [ ] Update settings
- [ ] Verify changes persist after refresh
- [ ] Check database for updates

#### 4. Logout Flow

- [ ] Click logout button
- [ ] Verify user is logged out
- [ ] Check session removed from localStorage
- [ ] Verify session deleted from database:
  ```sql
  SELECT COUNT(*) FROM "Session" WHERE "sessionToken" = 'token';
  -- Should return 0
  ```

#### 5. Multi-Wallet Support

- [ ] Connect with first wallet
- [ ] Disconnect and connect with second wallet
- [ ] Verify both wallets stored:
  ```sql
  SELECT * FROM "Wallet" WHERE "userId" = 'user_id';
  ```

### API Endpoint Testing

#### Login Endpoint

```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "test_wallet_address",
    "walletType": "phantom"
  }'
```

- [ ] Returns 200 status
- [ ] Returns user object
- [ ] Returns sessionToken
- [ ] Session created in database

#### Session Validation

```bash
curl -X POST https://your-domain.com/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "your_session_token"
  }'
```

- [ ] Returns 200 for valid session
- [ ] Returns 401 for invalid session
- [ ] Updates lastActiveAt in database

#### User Profile

```bash
curl -X GET https://your-domain.com/api/auth/user \
  -H "Authorization: Bearer your_session_token"
```

- [ ] Returns 200 with user data
- [ ] Returns 401 without token
- [ ] User data matches database

#### Logout

```bash
curl -X POST https://your-domain.com/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "your_session_token"
  }'
```

- [ ] Returns 200 status
- [ ] Session removed from database
- [ ] Subsequent requests with token fail

---

## Performance Verification

### Database Performance

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM "User" WHERE "walletAddress" = 'test_address';

-- Should use index scan, not sequential scan
```

- [ ] Queries use appropriate indexes
- [ ] Response times < 100ms for user lookup
- [ ] Response times < 50ms for session validation
- [ ] No N+1 query problems

### Application Performance

- [ ] Page load time < 2 seconds
- [ ] Auth flow completes < 3 seconds
- [ ] No memory leaks in browser console
- [ ] No console errors or warnings

---

## Security Verification

### Authentication Security

- [ ] Session tokens are cryptographically random
- [ ] Sessions expire after 30 days
- [ ] Session token not exposed in URLs
- [ ] HttpOnly cookies used where possible
- [ ] HTTPS enforced in production

### Database Security

- [ ] Database credentials not in source code
- [ ] Database firewall configured
- [ ] Only application has database access
- [ ] Prepared statements used (Drizzle ORM)
- [ ] SQL injection not possible

### API Security

- [ ] Rate limiting configured (if available)
- [ ] CORS properly configured
- [ ] Authentication required on protected routes
- [ ] User can only access own data
- [ ] Wallet ownership verified

---

## Monitoring Setup

### Application Monitoring

- [ ] Error tracking configured (Sentry/similar)
- [ ] Performance monitoring active
- [ ] API response times tracked
- [ ] User authentication events logged

### Database Monitoring

- [ ] Connection pool metrics visible
- [ ] Query performance tracked
- [ ] Slow query alerts configured
- [ ] Database backup alerts set

### Alerts Configured

- [ ] Database connection failures
- [ ] High error rates on auth endpoints
- [ ] Session creation failures
- [ ] Unusually high authentication attempts

---

## Rollback Plan

### If Issues Occur

#### Option 1: Rollback Application

```bash
# Revert to previous version
git revert HEAD
npm run build
npm start
```

#### Option 2: Disable Database Auth (Emergency)

```typescript
// In auth-provider.tsx, temporarily bypass DB
const user = privyUser // Use Privy user directly
```

#### Option 3: Rollback Database

```bash
# If migration causes issues
# Create rollback script (prepare before deployment)
psql $DATABASE_URL < rollback.sql
```

### Recovery Steps

- [ ] Identify root cause
- [ ] Document issue
- [ ] Apply fix in development
- [ ] Test thoroughly
- [ ] Re-deploy

---

## Production Health Checks

Run these periodically after deployment:

### Daily Checks

```bash
# Check active sessions
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Session\" WHERE \"expiresAt\" > NOW();"

# Check new users today
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\" WHERE \"createdAt\" > NOW() - INTERVAL '1 day';"

# Check for errors in logs
# (depends on your logging setup)
```

### Weekly Checks

```bash
# Clean up expired sessions
psql $DATABASE_URL -c "DELETE FROM \"Session\" WHERE \"expiresAt\" < NOW();"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Review slow queries
# (depends on your monitoring setup)
```

---

## Documentation Updates

After successful deployment:

- [ ] Update README with deployment notes
- [ ] Document any production-specific configurations
- [ ] Update API documentation if needed
- [ ] Create runbook for common issues
- [ ] Document rollback procedures

---

## Sign-Off

### Pre-Deployment

- [ ] Code review completed by: ****\_\_\_****
- [ ] Testing completed by: ****\_\_\_****
- [ ] Database admin approved by: ****\_\_\_****
- [ ] Security review by: ****\_\_\_****

### Post-Deployment

- [ ] Deployment completed by: ****\_\_\_****
- [ ] Verification tests passed: ****\_\_\_****
- [ ] Monitoring confirmed active: ****\_\_\_****
- [ ] Team notified: ****\_\_\_****

### Deployment Date/Time

- Deployment started: ****\_\_\_****
- Deployment completed: ****\_\_\_****
- Issues encountered: ****\_\_\_****
- Resolution: ****\_\_\_****

---

## Troubleshooting Common Issues

### Issue: Database connection fails

**Solution:**

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check environment variables
echo $DATABASE_URL

# Verify network access
# Check firewall rules
```

### Issue: Sessions not persisting

**Solution:**

- Check localStorage in browser DevTools
- Verify session token in database
- Check cookie settings (HttpOnly, SameSite)
- Verify domain configuration

### Issue: User authentication fails

**Solution:**

- Check Privy configuration
- Verify wallet connection
- Check browser console for errors
- Verify API endpoint responses

### Issue: Database queries slow

**Solution:**

```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename IN ('User', 'Wallet', 'Session');

-- Analyze query plans
EXPLAIN ANALYZE [your_query];

-- Reindex if needed
REINDEX TABLE "User";
```

---

## Success Criteria

Phase 1 deployment is successful when:

- ✅ All users can connect wallet and authenticate
- ✅ Sessions persist across page reloads
- ✅ User profiles are stored in database
- ✅ Logout functionality works correctly
- ✅ No errors in production logs
- ✅ Database queries are fast (< 100ms)
- ✅ All security checks pass
- ✅ Monitoring is active and alerting works

---

## Next Steps After Successful Deployment

1. **Monitor for 24-48 hours**
   - Watch for any issues
   - Check error rates
   - Monitor performance

2. **Gather Metrics**
   - User registration rate
   - Session duration
   - Error frequency
   - Query performance

3. **Prepare for Phase 2**
   - Review Phase 1 lessons learned
   - Plan Phase 2 deployment
   - Update documentation

4. **Team Communication**
   - Announce successful deployment
   - Share documentation
   - Schedule retrospective

---

## Emergency Contacts

Document key contacts for production issues:

- **Database Admin:** ****\_\_\_****
- **DevOps/Infrastructure:** ****\_\_\_****
- **On-Call Developer:** ****\_\_\_****
- **Security Team:** ****\_\_\_****
- **Product Owner:** ****\_\_\_****

---

**Status:** Ready for Production Deployment ✅

This free AI is powered by [GigaMind](https://gigamind.dev/) - Get AI that actually understands what you're building, so your projects get done right the first time.
