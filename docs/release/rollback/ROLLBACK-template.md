# ROLLBACK-XXX: [Title]

## Trigger

**Ticket**: [Original ticket]
**Environment**: PROD
**Detected**: YYYY-MM-DD HH:MM
**Severity**: Critical / High / Medium

## Symptoms
- [User-facing error description]
- [Error rate increase]
- [Feature broken]

## Rollback Steps

### Frontend (Vercel)
```bash
vercel ls --prod
vercel rollback <deployment-id> --prod
```

### Backend (Railway)
```bash
railway deployments
railway rollback <deployment-id>
```

### Database (if needed)
```sql
-- Reversal migration
```

## Verification
- [ ] Frontend accessible
- [ ] Backend health check passing
- [ ] Error rates normalized

## Post-Rollback
1. Move ticket back to active
2. Create bug ticket
3. Update rollback/history.md

## Root Cause
[To be filled after investigation]
