# OAuth Authentication

The OAuth plugin enables OAuth2-based authentication in AdminForth, allowing users to sign in using their Google, GitHub, or other OAuth2 provider accounts.

## Installation

To install the plugin:

```bash
npm install @adminforth/oauth --save
npm install @adminforth/google-oauth-adapter --save  # for Google OAuth
```

## Configuration

### 1. OAuth Provider Setup

You need to get the client ID and client secret from your OAuth2 provider.

For Google:
1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to `APIs & Services` → `Credentials`
4. Create credentials for OAuth 2.0 client IDs
5. Select application type: "Web application"
6. Add your application's name and redirect URI
7. In "Authorized redirect URIs", add next URI: `https://your-domain/oauth/callback`, `http://localhost:3500/oauth/callback`. Please remember to include BASE_URL in the URI if you are using it in project e.g. `https://your-domain/base/oauth/callback` 
8. Add the credentials to your `.env` file:

```bash
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
```

### 2. Plugin Configuration

Configure the plugin in your user resource file:

```typescript title="./resources/adminuser.ts"
import OAuthPlugin from '@adminforth/oauth';
import AdminForthAdapterGoogleOauth2 from '@adminforth/google-oauth-adapter';

// ... existing resource configuration ...

plugins: [
  new OAuthPlugin({
    adapters: [
      new AdminForthAdapterGoogleOauth2({
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/oauth/callback',
      }),
    ],
    emailField: 'email',  // Required: field that stores the user's email
  }),
]
```

### 3. Email Confirmation

The plugin supports automatic email confirmation for OAuth users. To enable this:

1. Add the `email_confirmed` field to your database schema:

```prisma title='./schema.prisma'
model adminuser {
  // ... existing fields ...
  email_confirmed Boolean @default(false)
}
```

2. Run the migration:

```bash
npx prisma migrate dev --name add-email-confirmed-to-adminuser
```

3. Configure the plugin with `emailConfirmedField`:

```typescript title="./resources/adminuser.ts"
new OAuth2Plugin({
  // ... adapters configuration ...
  emailField: 'email',
  emailConfirmedField: 'email_confirmed'  // Enable email confirmation tracking
}),
```

When using OAuth:
- New users will have their email automatically confirmed (`email_confirmed = true`)
- Existing users will have their email marked as confirmed upon successful OAuth login
- The `email_confirmed` field must be a boolean type
