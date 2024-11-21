import AdminForth, { AdminForthPlugin, Filters, suggestIfTypo, AdminForthDataTypes } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthComponentDeclaration, AdminForthResourceColumn, AdminForthResource, BeforeLoginConfirmationFunction } from "adminforth";
import type { PluginOptions } from './types.js';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';


export default class OpenSignupPlugin extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  passwordField: AdminForthResourceColumn;
  authResource: AdminForthResource;
  emailConfirmedField?: AdminForthResourceColumn;
  
  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);

    if (!this.options.emailField) {
      throw new Error(`emailField is required and should be a name of field in auth resource`);
    }

    if (this.options.confirmEmails) {
      if (!this.options.confirmEmails.emailProvider) {
        throw new Error(`confirmEmails.emailProvider is required and should be a name of field in auth resource`);
      }
      if (!this.options.confirmEmails.emailConfirmedField) {
        throw new Error(`confirmEmails.emailConfirmedField is required and should be a name of field in auth resource`);
      }
      const emailConfirmedField = this.authResource.columns.find(f => f.name === this.options.confirmEmails.emailConfirmedField);
      if (!emailConfirmedField) {
        const similar = suggestIfTypo(this.authResource.columns.map(f => f.name), this.options.confirmEmails.emailConfirmedField);
        throw new Error(`Field with name ${this.options.confirmEmails.emailConfirmedField} not found in resource ${this.authResource.resourceId}.
          ${similar ? `Did you mean ${similar}?` : ''}
        `);
      }
      this.emailConfirmedField = emailConfirmedField;
      if (this.emailConfirmedField.type !== AdminForthDataTypes.BOOLEAN) {
        throw new Error(`Field ${this.emailConfirmedField.name} must be of type boolean`);
      }
    }

    // find field with name resourceConfig.emailField in adminforth.auth.usersResourceId and show error if it doesn't exist
    const authResource = adminforth.config.resources.find(r => r.resourceId === adminforth.config.auth.usersResourceId);
    if (!authResource) {
      throw new Error(`Resource with id config.auth.usersResourceId=${adminforth.config.auth.usersResourceId} not found`);
    }
    this.authResource = authResource;

    const emailField = authResource.columns.find(f => f.name === this.options.emailField);
    if (!emailField) {
      const similar = suggestIfTypo(authResource.columns.map(f => f.name), this.options.emailField);

      throw new Error(`Field with name ${this.options.emailField} not found in resource ${authResource.resourceId}.
        ${similar ? `Did you mean ${similar}?` : ''}
      `);
    }
    this.emailField = emailField;

    if (!this.options.passwordField) {
      throw new Error(`passwordField is required to get password constraints and should be a name of virtual field in auth resource`);
    }

    const passwordField: AdminForthResourceColumn = authResource.columns.find(f => f.name === this.options.passwordField);
    if (!passwordField) {
      const similar = suggestIfTypo(authResource.columns.map(f => f.name), this.options.passwordField);
      throw new Error(`Field with name ${this.options.passwordField} not found in resource ${authResource.resourceId}.
        ${similar ? `Did you mean ${similar}?` : ''}
      `);
    }
    this.passwordField = passwordField;

    (adminforth.config.customization.loginPageInjections.underInputs as AdminForthComponentDeclaration[]).push({ 
      file: this.componentPath('SignupUnderLogin.vue'),
    });
    adminforth.config.customization.customPages.push({
      path: '/signup',
      component: { 
        file: this.componentPath('SignupPage.vue'), 
        meta: { 
          customLayout: true, 
          pluginInstanceId: this.pluginInstanceId,
          passwordField: {
            minLength: passwordField.minLength,
            maxLength: passwordField.maxLength,
            validation: passwordField.validation
          }
        }
      }
    });

    // for confirmation disable login if email is not confirmed
    if (this.options.confirmEmails) {
      if (!adminforth.config.auth.beforeLoginConfirmation) {
        adminforth.config.auth.beforeLoginConfirmation = [];
      }
      // unshift because if e.g. 2fa set it's hook, this one should be first
      (adminforth.config.auth.beforeLoginConfirmation as BeforeLoginConfirmationFunction[]).unshift(
        async ({ adminUser }) => {
          if (!adminUser.dbUser[this.emailConfirmedField.name]) {
            return { body: { allowedLogin: false }, error: 'You need to confirm your email to be able to login' };
          }
        }
      );
    }
  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `single`;
  }

  async doLogin(email: string, response: any): Promise<{ error?: string; allowedLogin: boolean; redirectTo?: string; }> {

    const username = email;
    const userRecord = await this.adminforth.resource(this.authResource.resourceId).get(Filters.EQ(this.emailField.name, email));
    const adminUser = { 
      dbUser: userRecord,
      pk: userRecord[this.authResource.columns.find((col) => col.primaryKey).name], 
      username,
    };
    const toReturn = { allowedLogin: true, error: '' };

    await this.adminforth.restApi.processLoginCallbacks(adminUser, toReturn, response);
    if (toReturn.allowedLogin) {
      this.adminforth.auth.setAuthCookie({ 
        response, 
        username, 
        pk: userRecord[
          this.authResource.columns.find((col) => col.primaryKey).name
        ] 
      });
    }

    return toReturn;
  }


  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/completeVerifiedSignup`,
      noAuth: true,
      handler: async ({ body, response }) => {
        const { token } = body;
        const { email } = await this.adminforth.auth.verify(token, 'tempVerifyEmailToken');
        if (!email) {
          return { error: 'Invalid token', ok: false };
        }
        const userRecord = await this.adminforth.resource(this.authResource.resourceId).get(Filters.EQ(this.emailField.name, email));
        if (!userRecord) {
          return { error: 'User not found', ok: false };
        }
        await this.adminforth.resource(this.authResource.resourceId).update(userRecord[this.authResource.columns.find((col) => col.primaryKey).name], {
          [this.options.confirmEmails.emailConfirmedField]: true
        });
        return await this.doLogin(email, response);
      }
    });

    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/signup`,
      noAuth: true,
      handler: async ({ body, response }) => {
        const { email, url, password } = body;

        // validate email
        if (this.emailField.validation) {
          for (const { regExp, message } of this.emailField.validation) {
            if (!new RegExp(regExp).test(email)) {
              return { error: message, ok: false };
            }
          }
        }

        // validate password
        if (password.length < this.passwordField.minLength) {
          return { error: `Password must be at least ${this.passwordField.minLength} characters long`, ok: false };
        }
        if (password.length > this.passwordField.maxLength) {
          return { error: `Password must be at most ${this.passwordField.maxLength} characters long`, ok: false };
        }
        if (this.passwordField.validation) {
          for (const { regExp, message } of this.passwordField.validation) {
            if (!new RegExp(regExp).test(password)) {
              return { error: message, ok: false };
            }
          }
        }

        // first check again if email already exists
        const existing = await this.adminforth.resource(this.authResource.resourceId).count(Filters.EQ(this.emailField.name, email));
        if (existing > 0) {
          return { error: 'Email already exists', ok: false };
        }

        // create user
        const created = await this.adminforth.resource(this.authResource.resourceId).create({
          ...(this.options.defaultFieldValues || {}),
          ...(this.options.confirmEmails ? { [this.options.confirmEmails.emailConfirmedField]: false } : {}),  
          [this.emailField.name]: email,
          [this.options.passwordHashField]: await AdminForth.Utils.generatePasswordHash(password),
        });
        
        if (!this.options.confirmEmails) {
          const resp = await this.doLogin(email, response);
          return resp;
        }

        // send confirmation email

        const brandName = this.adminforth.config.customization.brandName;

        const verifyToken = this.adminforth.auth.issueJWT({email, issuer: brandName }, 'tempVerifyEmailToken', '2h');

        // send email with AWS SES this.options.providerOptions.AWS_SES
        const ses = new SESClient({
          region: this.options.confirmEmails.providerOptions.AWS_SES.region,
          credentials: {
            accessKeyId: this.options.confirmEmails.providerOptions.AWS_SES.accessKeyId,
            secretAccessKey: this.options.confirmEmails.providerOptions.AWS_SES.secretAccessKey
          }
        });

        process.env.HEAVY_DEBUG && console.log('🐛Sending reset tok to', verifyToken);

        const emailCommand = new SendEmailCommand({
          Destination: {
            ToAddresses: [email]
          },
          Message: {
            Body: {
              Text: {
                Charset: "UTF-8",
                Data: `
                  Dear user,
                  Welcome to ${brandName}! 
                  
                  To confirm your email, click the link below:\n\n

                  ${url}?verifyToken=${verifyToken}\n\n

                  If you didn't request this, please ignore this email.\n\n
                  Link is valid for 2 hours.\n\n

                  Thanks,
                  The ${brandName} Team
                                    
                `
              },
              Html: {
                Charset: "UTF-8",
                Data: `
                <html>
                  <head></head>
                  <body>
                    <p>Dear user,</p>
                    <p>Welcome to ${brandName}!</p>
                    <p>To confirm your email, click the link below:</p>
                    <a href="${url}?token=${verifyToken}">Confirm email</a>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>Link is valid for 2 hours.</p>
                    <p>Thanks,</p>
                    <p>The ${brandName} Team</p>
                  </body>
                </html>


                `
              }
            },
            Subject: {
              Charset: "UTF-8",
              Data: `Signup request at ${brandName}`
            }
          },
          Source: `${this.options.confirmEmails.sendFrom}`
        });

        try {
          const sRes = await ses.send(emailCommand);
        } catch (e) {
          console.error('Error sending email', e);
          if (process.env.NODE_ENV === 'development') {
            return { error: 'Some thing went wrong, please check the console', ok: false };
          }
          return { error: 'Something went wrong, please contact support', ok: false };
        }

        return { ok: true };
      }
    });

   

  }

}