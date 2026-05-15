# Security Remediation Report

**Date of Review:** May 15, 2026  
**Reviewed by:** Automated Security Scan  
**Package Manager:** Yarn 1.x (Classic)

## Supply-Chain Compromise Check

### Packages Searched

The following potentially compromised packages were checked:

| Package Pattern | Status |
|----------------|--------|
| `@tanstack/react-router`, `router-core`, `react-start`, `router-plugin`, etc. | **Not found** (only `@tanstack/react-query` and `@tanstack/react-table` present - these were not affected) |
| `@opensearch-project/opensearch` | **Not found** |
| `@mistralai/*` | **Not found** |
| `@uipath/*` | **Not found** |
| `@squawk/*` | **Not found** |
| `@draftlab/*` | **Not found** |
| `@draftauth/*` | **Not found** |
| `safe-action` | **Not found** |
| `cmux-agent-mcp` | **Not found** |
| `nextmove-mcp` | **Not found** |
| `ts-dna` | **Not found** |
| `cross-stitch` | **Not found** |
| `plain-crypto-js` | **Not found** |
| `axios` (compromised: 1.14.1, 0.30.4) | **Safe** - was 1.15.0, updated to 1.16.1 |

### Indicators of Compromise Checked

| Indicator | Status |
|-----------|--------|
| `bun_environment.js` | **Not found** |
| `setup_bun.js` | **Not found** |
| `Shai-Hulud` / `shai-hulud` references | **Not found** |
| Suspicious GitHub Actions workflow changes | **Not found** |
| Suspicious npm lifecycle scripts | **Not found** |

## Security Updates Applied

### axios: 1.15.0 → 1.16.1

**Reason:** While axios 1.15.0 was not a supply-chain compromised version (those were 1.14.1 and 0.30.4), `yarn audit` identified multiple security vulnerabilities in 1.15.0:

| Severity | Advisory | Description |
|----------|----------|-------------|
| HIGH | CVE-2025-62718 | NO_PROXY Protection Bypassed via RFC 1122 Loopback Subnet |
| MODERATE | 1117574 | Authentication Bypass via Prototype Pollution in `validateStatus` |
| MODERATE | 1117577 | Invisible JSON Response Tampering via Prototype Pollution in `parseReviver` |
| MODERATE | 1117581 | CRLF Injection in multipart/form-data via unsanitized blob.type |
| MODERATE | 1117583 | no_proxy bypass via IP alias allows SSRF |
| MODERATE | 1117585 | Unbounded recursion in toFormData causes DoS |
| LOW | 1117580 | Null Byte Injection via Reverse-Encoding in AxiosURLSearchParams |

All vulnerabilities are patched in axios >=1.15.2. Updated to 1.16.1 (latest stable).

## Remaining Transitive Vulnerabilities

The following vulnerabilities exist in transitive dependencies and require upstream fixes:

| Package | Via | Severity | Patched In | Notes |
|---------|-----|----------|------------|-------|
| quill | react-quill | MODERATE | No patch | XSS vulnerability |
| minimatch | prettier-eslint (devDep) | HIGH | >=9.0.7 | ReDoS vulnerabilities |
| dompurify | monaco-editor | MODERATE | >=3.4.0 | Multiple XSS vulnerabilities |
| postcss | next | MODERATE | >=8.5.10 | XSS via unescaped `</style>` |

These cannot be directly fixed without upstream package updates.

## Commands Run

```bash
# Package manager identification
ls package-lock.json pnpm-lock.yaml yarn.lock bun.lock*

# Dependency search
grep -E '@tanstack/|axios|@opensearch|@mistralai|...' package.json yarn.lock

# Version verification
yarn why axios

# Security audit
yarn audit

# Compromise indicator search
grep -r 'bun_environment|setup_bun|shai-hulud' .

# Dependency update
vim package.json  # axios: 1.15.0 → 1.16.1
rm -rf node_modules && yarn install

# Verification
yarn audit
yarn lint
yarn build
```

## Test Results

- **Lint:** Pre-existing warnings (338 problems: 55 errors, 283 warnings) - unrelated to security update
- **Build:** Passed successfully

## Secrets Rotation Recommendation

**No compromised supply-chain packages were installed.** The axios version (1.15.0) was not one of the malicious versions.

However, as a general security hygiene measure after any security review:

### Low Priority (Recommended but not urgent)
- Review npm token expiration/rotation schedule
- Audit GitHub Actions secrets access logs

### Not Required
- No evidence of credential exfiltration
- No malicious lifecycle scripts found
- No indicators of compromise detected

## Conclusion

✅ **No supply-chain compromised packages were found in this repository.**

The axios package was updated from 1.15.0 to 1.16.1 to address known security vulnerabilities (separate from the supply-chain attack).

The repository does not use any of the known compromised packages (@tanstack router packages, axios 1.14.1/0.30.4, plain-crypto-js, etc.).
