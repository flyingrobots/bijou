# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Bijou, please report it
responsibly.

**Do not open a public issue.** Instead, email the maintainers
directly or use GitHub's private vulnerability reporting feature:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Provide a description of the vulnerability, steps to reproduce,
   and any relevant context.

We will acknowledge receipt within 48 hours and aim to provide a fix
or mitigation within 7 days for critical issues.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 4.1.x   | Yes       |
| < 4.0   | No        |

## Scope

This policy covers the following packages:

- `@flyingrobots/bijou`
- `@flyingrobots/bijou-node`
- `@flyingrobots/bijou-tui`
- `@flyingrobots/bijou-tui-app`
- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`
- `@flyingrobots/bijou-i18n-tools-node`
- `@flyingrobots/bijou-i18n-tools-xlsx`
- `create-bijou-tui-app`

## Dependencies

Bijou's core package (`@flyingrobots/bijou`) has zero runtime
dependencies. The Node.js adapter and tooling packages have minimal
dependencies. We monitor for vulnerabilities via `npm audit` in CI.
