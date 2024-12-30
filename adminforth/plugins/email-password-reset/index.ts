import AdminForth, { AdminForthPlugin, Filters, suggestIfTypo } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthComponentDeclaration, AdminForthResourceColumn, AdminForthDataTypes, AdminForthResource } from "adminforth";
import type { PluginOptions } from './types.js';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import validator from 'validator';

export default class EmailPasswordReset extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  authResourceId: string;
  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);

    // find field with name resourceConfig.emailField in adminforth.auth.usersResourceId and show error if it doesn't exist
    const authResource = adminforth.config.resources.find(r => r.resourceId === adminforth.config.auth.usersResourceId);
    if (!authResource) {
      throw new Error(`Resource with id config.auth.usersResourceId=${adminforth.config.auth.usersResourceId} not found`);
    }
    this.authResourceId = authResource.resourceId;

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

    const passwordField = authResource.columns.find(f => f.name === this.options.passwordField);
    if (!passwordField) {
      const similar = suggestIfTypo(authResource.columns.map(f => f.name), this.options.passwordField);

      throw new Error(`Field with name ${this.options.passwordField} not found in resource ${authResource.resourceId}.
        ${similar ? `Did you mean ${similar}?` : ''}
      `);
    }

    if (!this.options.adapter) {
      throw new Error('Adapter is required. Please provide a valid adapter in the plugin options.');
    }


    adminforth.config.customization.loginPageInjections.underInputs.push({ 
      file: this.componentPath('ResetPasswordUnderLogin.vue') }
    );
    adminforth.config.customization.customPages.push({
      path:'/reset-password',
      component: { 
        file: this.componentPath('ResetPassword.vue'), 
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
    })

    // simply modify resourceConfig or adminforth.config. You can get access to plugin options via this.options;
  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed

    this.options.adapter.validate();
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `single`;
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/reset-password`,
      noAuth: true,
      handler: async ({ body }) => {
        const { email, url } = body;

        // validate email
        if (!validator.isEmail(email)) {
          return { error: 'Invalid email address', ok: false };
        }

        const af = await this.adminforth.resource(this.authResourceId).get(Filters.EQ(this.emailField.name, email));
        if (af) {
          const brandName = this.adminforth.config.customization.brandName;

          const resetToken = this.adminforth.auth.issueJWT({email, issuer: brandName }, 'tempResetPassword', '2h');

          console.log('Sending reset tok to', resetToken);

          const emailText = `
                    Dear user,
                    To reset your ${brandName} password, click the link below:\n\n

                    ${url}?token=${resetToken}\n\n

                    If you didn't request this, please ignore this email.\n\n
                    Link is valid for 2 hours.\n\n

                    Thanks,
                    The ${brandName} Team
                                      
                  `;
          
          const emailHtml = `
                  <html>
                    <head></head>
                    <body>
                      <p>Dear user,</p>
                      <p>To reset your ${brandName} password, click the link below:</p>
                      <p><a href="${url}?token=${resetToken}">Reset password</a></p>
                      <p>If you didn't request this, please ignore this email.</p>
                      <p>Link is valid for 2 hours.</p>
                      <p>Thanks,</p>
                      <p>The ${brandName} Team</p>
                    </body>
                  </html>


                  `;
          const emailSubject = `Password reset request at ${brandName}`;
          // send email with AWS SES this.options.providerOptions.AWS_SES
          this.options.adapter.sendEmail(this.options.sendFrom, email, emailText, emailHtml, emailSubject);
        }

        return { ok: true };
      }
    });

    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/reset-password-confirm`,
      noAuth: true,
      handler: async ({ body }) => {
        const { token, password } = body;
        console.log('token', token);
        const decoded = await this.adminforth.auth.verify(token, 'tempResetPassword', false);
        if (!decoded) {
          return { error: 'Invalid token', ok:false };
        }

        const af = await this.adminforth.resource(this.authResourceId).get(Filters.EQ(this.emailField.name, decoded.email));
        if (af) {
          // find password hash field name
          const passwordHashFieldName = this.adminforth.config.auth.passwordHashField;
          const newPasswordHash = await AdminForth.Utils.generatePasswordHash(password);
          const primaryKeyField = this.adminforth.config.resources.find(r => r.resourceId === this.authResourceId).columns.find(c => c.primaryKey);
          // update password

          console.log('Updating password', primaryKeyField, af[primaryKeyField.name], passwordHashFieldName, newPasswordHash);
          await this.adminforth.resource(this.authResourceId).update(af[primaryKeyField.name], { [passwordHashFieldName]: newPasswordHash });
        }

        return { ok: true };
      }
    });

  }

}