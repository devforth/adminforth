---
description: "Reference page for AdminForth OAuth2 adapters, including provider setup for Google, GitHub, Facebook, Keycloak, Microsoft, and Twitch sign-in flows."
---

# OAuth2 Adapters

Used to authenticate users via OAuth 2.0 providers.

[OAuth2Adapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/OAuth2Adapter.ts#L9)

## Google OAuth Adapter

```bash
pnpm i @adminforth/google-oauth-adapter
```

Supports Google sign-in to allow users to authenticate using their Google or Google Workspaces accounts.

## GitHub OAuth Adapter

```bash
pnpm i @adminforth/github-oauth-adapter
```

Enables authentication via GitHub accounts, useful for developer tools and open-source apps.

## Facebook OAuth Adapter

```bash
pnpm i @adminforth/facebook-oauth-adapter
```

Allows users to log in with Facebook credentials. Facebook OAuth is commonly used for social media integrations.

## Keycloak OAuth Adapter

```bash
pnpm i @adminforth/keycloak-oauth-adapter
```

Connects AdminForth to an open-source [Keycloak](https://www.keycloak.org/) identity provider for enterprise-grade SSO (Single Sign-On).

## Microsoft OAuth Adapter

```bash
pnpm i @adminforth/microsoft-oauth-adapter
```

Supports login through Microsoft accounts including Azure AD, Office365, and Outlook.com.

## Twitch OAuth Adapter

```bash
pnpm i @adminforth/twitch-oauth-adapter
```

Adds support for Twitch authentication, useful for streaming or creator-oriented platforms.