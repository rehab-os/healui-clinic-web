# Auth Migration Report — Firebase → AWS Cognito

> Generated: March 2026 | HealUI Clinic Web App
> Context: Firebase Auth phone OTP is blocked by Indian ISPs (Section 69A order, Feb 2026). Current setup is also NOT HIPAA compliant.

---

## Current Setup

- **Provider**: Firebase Auth (`signInWithPhoneNumber` + invisible reCAPTCHA)
- **File**: `src/services/auth/firebase-auth.service.ts`
- **Config**: `src/config/firebase.config.ts`
- **Issue 1**: Blocked in India — ISPs (Jio, Airtel, ACT) blocking `identitytoolkit.googleapis.com` under Section 69A
- **Issue 2**: Firebase Auth is **NOT HIPAA compliant** — Google does not sign a BAA for standalone Firebase Auth
- **Issue 3**: India SMS cost is $0.07/msg via Firebase — expensive

---

## HIPAA Compliance Comparison

| Provider | HIPAA? | BAA? | Notes |
|---|---|---|---|
| **Firebase Auth (current)** | **NO** | **NO** | Google explicitly excludes Firebase Auth from HIPAA coverage |
| **GCP Identity Platform** | Yes | Yes | Same SDK, upgrade toggle — but same India blocking problem |
| **AWS Cognito** | Yes | Yes | HIPAA-eligible since 2017. No India blocking risk |
| **Twilio Verify** | Yes | Yes (Enterprise plan) | Most expensive option. Best delivery rates |
| **MSG91** | **NO** | **NO** | India-only provider. No HIPAA |
| **Clerk** | Yes (Enterprise only) | Yes | Pricing opaque. India SMS coverage unclear |
| **Custom OTP Backend** | Depends | N/A | Your responsibility. Host on HIPAA-eligible infra (AWS/GCP with BAA) |

---

## GCP Identity Platform — Why It Doesn't Solve the Problem

Despite being the easiest upgrade (zero code changes), GCP Identity Platform has critical issues:

- **Same endpoint** — `identitytoolkit.googleapis.com` — blocked by Indian ISPs
- **Same SMS infrastructure** — no ability to swap SMS providers
- **India SMS = $0.07/msg** — 25x more expensive than AWS ($0.00278)
- **Blocked 3 times in 18 months** in India:
  - Oct 13-21, 2024 (~8 days)
  - Jan 28, 2025 (~9 hours)
  - Feb 24, 2026 (ongoing — formal Section 69A government order)
- **No custom SMS provider** — locked to Google's SMS infra

The only benefit: HIPAA BAA + zero code changes. But users on Jio/Airtel still can't log in.

---

## AWS Cognito vs GCP Identity Platform

| Dimension | GCP Identity Platform | AWS Cognito |
|---|---|---|
| HIPAA + BAA | Yes | Yes |
| India blocked? | **Yes (3x in 18 months)** | **No** |
| India SMS cost | $0.07/msg | $0.00278/msg |
| US/UK SMS cost | $0.01 / $0.04 | $0.006 / $0.04 |
| Custom SMS provider | **No** — locked to Google | **Yes** — Custom SMS Sender Lambda |
| Global countries | ~195 | 200+ |
| Free tier | 50K MAUs | 50K MAUs |
| SLA | 99.95% | 99.99% |
| SDK quality | Excellent (firebase/auth) | Decent (verbose, use Amplify) |
| Per-country SMS routing | Not possible | **Yes** — via Lambda trigger |

---

## Cost Comparison — All Providers (Monthly in INR)

### SMS OTP Only (No WhatsApp)

| Provider | 500/mo | 5,000/mo | 25,000/mo | 100K/mo |
|---|---|---|---|---|
| **Firebase Auth (current)** | 420 | 4,200 | 21,000 | 84,000 |
| GCP Identity Platform | 420 | 4,200 | 21,000 | 84,000 |
| AWS Cognito + SNS | 117 | 1,168 | 5,838 | 23,352 |
| **AWS Cognito + MSG91 (India)** | **90** | **900** | **4,500** | **18,000** |
| Twilio Verify SMS | 5,595 | 55,944 | 279,720 | 11,18,880 |
| MSG91 SMS (no HIPAA) | 125 | 1,250 | 6,250 | 25,000 |
| Custom + SMS gateway | 90 | 900 | 4,500 | 18,000 |

### Global SMS Pricing per Message

| Country | Firebase / GCP | AWS SNS | Twilio |
|---|---|---|---|
| India | $0.07 | $0.00278 | $0.0832 |
| United States | $0.01 | $0.00581 | $0.0079 |
| United Kingdom | $0.04 | $0.04 | $0.04 |
| Australia | $0.02 | $0.02 | $0.04 |
| Germany | $0.10 | $0.07 | $0.07 |
| UAE | $0.08 | $0.06 | $0.05 |
| Singapore | $0.04 | $0.02 | $0.04 |
| Indonesia | $0.33 | $0.12 | $0.03 |
| Saudi Arabia | $0.18 | $0.04 | $0.03 |

---

## Ease of Implementation

| Approach | Effort | Time | Code Changes |
|---|---|---|---|
| GCP Identity Platform upgrade | Zero | 30 min | 0 lines (doesn't fix India) |
| AWS Cognito (basic) | Medium | 3-5 days | ~300-500 lines |
| AWS Cognito + Custom SMS Lambda | Medium-High | 5-7 days | ~500-700 lines |
| Clerk | Easy | 1-2 days | ~200 lines ($$$ for HIPAA) |
| Full custom OTP | High | 1-2 weeks | ~800-1200 lines |

---

## Recommendation: AWS Cognito + Custom SMS Sender Lambda

### Why

1. **HIPAA compliant** with BAA ✓
2. **Not blocked in India** — `cognito-idp.*.amazonaws.com` is not targeted ✓
3. **Cheapest** — route India via MSG91, international via Twilio ✓
4. **Global ready** — 200+ countries, per-country routing ✓
5. **50K MAUs free** ✓
6. **99.99% SLA** ✓

### Architecture

```
User enters phone number
    → Next.js API route calls Cognito InitiateAuth
    → Cognito triggers Custom SMS Sender Lambda
        → Lambda checks country code:
            +91 (India) → MSG91 API (INR 0.25/msg)
            +1 (US/CA)  → Twilio (best delivery)
            Others      → AWS End User Messaging (default)
    → User receives OTP via SMS
    → User enters OTP in app
    → Next.js API route calls Cognito ConfirmAuth
    → Cognito returns JWT tokens (ID + Access + Refresh)
    → Frontend stores tokens, backend verifies with Cognito JWKS
```

### Migration Plan

| Step | Task | Effort |
|---|---|---|
| 1 | Create AWS Cognito User Pool (phone as primary identifier) | 1 hour |
| 2 | Write Custom SMS Sender Lambda (MSG91 for +91, Twilio for rest) | 1 day |
| 3 | Create `src/services/auth/cognito-auth.service.ts` | 1-2 days |
| 4 | Update `src/app/login/page.tsx` to use new auth service | 1 day |
| 5 | Update `src/services/api/api.service.ts` for Cognito JWT tokens | 0.5 day |
| 6 | Update `src/app/dashboard/layout.tsx` auth checks | 0.5 day |
| 7 | Import existing user phone numbers to Cognito | 0.5 day |
| 8 | Testing + cutover | 1-2 days |
| **Total** | | **5-7 days** |

### Files to Change

- `src/config/firebase.config.ts` → `src/config/cognito.config.ts` (new)
- `src/services/auth/firebase-auth.service.ts` → `src/services/auth/cognito-auth.service.ts` (new)
- `src/app/login/page.tsx` (update auth calls)
- `src/services/api/api.service.ts` (update token handling)
- `src/app/dashboard/layout.tsx` (update auth state check)
- `src/store/slices/user.slice.ts` (if auth state shape changes)

### Cost at Scale (India-primary with global)

| Scale | Monthly Cost (INR) | vs Firebase Savings |
|---|---|---|
| 500 OTPs/mo | ~90 | 79% cheaper |
| 5,000 OTPs/mo | ~900 | 79% cheaper |
| 25,000 OTPs/mo | ~4,500 | 79% cheaper |
| 100,000 OTPs/mo | ~18,000 | **79% cheaper** |

---

## Sources

- [Firebase Auth HIPAA — Not Covered](https://www.blaze.tech/post/is-firebase-hipaa-compliant)
- [GCP Identity Platform HIPAA Guide](https://cloud.google.com/security/compliance/hipaa/identity-platform)
- [GCP Identity Platform Pricing](https://cloud.google.com/identity-platform/pricing)
- [AWS Cognito HIPAA Eligibility](https://aws.amazon.com/about-aws/whats-new/2017/07/amazon-cognito-achieves-hipaa-eligibility/)
- [AWS Cognito Custom SMS Sender Lambda](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-sms-sender.html)
- [AWS SNS SMS Pricing India](https://aws.amazon.com/sns/sms-pricing/)
- [AWS End User Messaging Pricing](https://aws.amazon.com/end-user-messaging/pricing/)
- [Twilio Verify Pricing](https://www.twilio.com/en-us/verify/pricing)
- [Twilio HIPAA](https://www.twilio.com/en-us/hipaa)
- [MSG91 OTP Pricing](https://msg91.com/in/pricing/otp)
- [Firebase India ISP Block (Status)](https://status.firebase.google.com/incidents/7aW9MWcFeBKSR3DSEyb8)
- [India Section 69A Block — Supabase/Firebase (TechCrunch)](https://techcrunch.com/2026/02/27/india-disrupts-access-to-popular-developer-platform-supabase-with-blocking-order/)
- [India ISP Block Details (Medianama)](https://www.medianama.com/2026/02/223-supabase-isp-level-block-jiofiber-users-india/)
- [Clerk HIPAA](https://clerk.com/pricing)
- [Firebase Auth Pricing 2026](https://www.metacto.com/blogs/the-complete-guide-to-firebase-auth-costs-setup-integration-and-maintenance)
