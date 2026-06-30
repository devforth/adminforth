import TwoFactorsAuthPlugin from "../../../plugins/adminforth-two-factors-auth/index.js";
import KeyValueAdapterRam from '../../../adapters/adminforth-key-value-adapter-ram/index.js';
import type { AdminUser } from '../../../adminforth/index.js';



export default new TwoFactorsAuthPlugin (
      { 
        twoFaSecretFieldName: 'secret2fa', 
        timeStepWindow: 1,
        stepUpMfaGracePeriodSeconds: 300,
        usersFilterToAllowSkipSetup: (adminUser: AdminUser) => {
          // allow skip setup 2FA for users which email is 'adminforth' or 'adminguest'
          return (true);
        },
        passkeys: {
          keyValueAdapter: new KeyValueAdapterRam(),
          credentialResourceID: "passkeys",
          credentialIdFieldName: "credential_id",
          credentialMetaFieldName: "meta",
          credentialUserIdFieldName: "user_id",
          settings: {
            expectedOrigin: "http://localhost:3123",
            rp: {
                name: "New Reality",
              },
            user: {
              nameField: "email",
              displayNameField: "email",
            },
            authenticatorSelection: {
              authenticatorAttachment: "both",
              requireResidentKey: true,
              userVerification: "required",
            },
          },
        } 
      }
    )