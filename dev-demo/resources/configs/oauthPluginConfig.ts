import OAuthPlugin from '../../../plugins/adminforth-oauth/index.js';
import AdminForthAdapterGoogleOauth2 from '../../../adapters/adminforth-oauth-adapter-google/index.js';
import AdminForthFacebookAdapter from '../../../adapters/adminforth-oauth-adapter-facebook/index.js';
import AdminForthAdapterGithubOauth2 from '../../../adapters/adminforth-oauth-adapter-github/index.js';


export default new OAuthPlugin({
  userAvatarField: "avatar",
  adapters: [
    new AdminForthAdapterGoogleOauth2({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      useOpenIdConnect: false,
    }),
    // new AdminForthFacebookAdapter({   🤮
    //   clientID: process.env.FACEBOOK_CLIENT_ID as string,🤮
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,🤮
    // }),🤮
    new AdminForthAdapterGithubOauth2({
      clientID: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  emailField: 'email',
  openSignup: {
    enabled: true,
    defaultFieldValues: { // Set default values for new users
      role: 'user',
    },
  },
  externalIdentityResource: {
    resourceId: 'admin_user_external_identities',
    emailField: 'email',
    phoneField: 'phone',
    fullNameField: 'fullName',
    avatarUrlField: 'avatarUrl',
    metaField: 'meta',
  },
})
