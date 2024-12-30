import type { AdapterOptions } from "./types.js";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import type { EmailAdapter } from "adminforth";

export default class EmailAdapterAwsSes implements EmailAdapter {
  options: AdapterOptions;

  constructor(options: AdapterOptions) {
    this.options = options;
  }

  validate() {
    if (!this.options.region) {
      throw new Error("AWS SES region is required");
    }
    if (!this.options.accessKeyId) {
      throw new Error("AWS SES accessKeyId is required");
    }
    if (!this.options.secretAccessKey) {
      throw new Error("AWS SES secretAccessKey is required");
    }
  }

  sendEmail = async (
    from: string,
    to: string,
    text: string,
    html: string,
    subject: string
  ) => {
    // send email with AWS SES this.options.providerOptions.AWS_SES
    const ses = new SESClient({
      region: this.options.region,
      credentials: {
        accessKeyId: this.options.accessKeyId,
        secretAccessKey: this.options.secretAccessKey,
      },
    });

    const emailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: text,
          },
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: from,
    });

    try {
      const sRes = await ses.send(emailCommand);
    } catch (e) {
      console.error("Error sending email", e);
      if (process.env.NODE_ENV === "development") {
        return {
          error: "Some thing went wrong, please check the console",
          ok: false,
        };
      }
      return {
        error: "Something went wrong, please contact support",
        ok: false,
      };
    }
  };
}
