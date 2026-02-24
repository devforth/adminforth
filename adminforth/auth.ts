
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AdminForth from './index.js';
import { IAdminForthAuth } from './types/Back.js';
import { afLogger } from './modules/logger.js';
import is_ip_private from 'private-ip'

// Function to generate a password hash using PBKDF2
function calcPasswordHash(password, salt, iterations = 100000, keyLength = 64, digest = 'sha512') {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

// Function to generate a random salt
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function parseTimeToSeconds(time: string): number {
  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1), 10);
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}

class AdminForthAuth implements IAdminForthAuth {
  adminforth: AdminForth;

  constructor(adminforth) {
    this.adminforth = adminforth;
  }

getClientIp(headers: object) {
    const clientIpHeader = this.adminforth.config.auth.clientIpHeader;

    const headersLower = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key];
      return acc;
    }, {});

    let ip: string | null = null;
    if (clientIpHeader) {
      ip = headersLower[clientIpHeader.toLowerCase()];
    } else {
      // first try common headers which can't bee spoofed, in other words
      // most common to nginx/traefik/apache
      // then fallback to less secure headers
      ip = headersLower['x-forwarded-for']?.split(',').shift().trim() ||
       headersLower['x-real-ip'] || 
       headersLower['x-client-ip'] || 
       headersLower['x-cluster-client-ip'] || 
       headersLower['forwarded'] || 
       headersLower['remote-addr'] || 
       headersLower['client-ip'] || 
       headersLower['client-address'] || 
       headersLower['client'] || 
       headersLower['x-host'] ||
       null;
    }
    const isIpPrivate = is_ip_private(ip)
    if (isIpPrivate) {
      return null;
    }
    return ip;
  }

  removeAuthCookie(response) {
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_jwt=; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }

  setAuthCookie({ expireInDuration, response, username, pk}: {
    expireInDuration?: string,
    response: any, 
    username: string, 
    pk: string | null
  }) {
    const expiresIn: string = expireInDuration || (process.env.ADMINFORTH_AUTH_EXPIRESIN || '24h');
    // might be h,m,d in string
    const expiresInSec = parseTimeToSeconds(expiresIn);

    const token = this.issueJWT({ username, pk}, 'auth', expiresInSec);
    const expiresCookieFormat = new Date(Date.now() + expiresInSec * 1000).toUTCString();
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_jwt=${token}; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=${expiresCookieFormat}`);
  }

  removeCustomCookie({response, name}) {
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_${name}=; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }

  setCustomCookie({ response, payload }: {
    response: any, payload: { name: string, value: string, expiry?: number | undefined, expirySeconds: number | undefined, httpOnly: boolean, sessionBased?: boolean | undefined }
  }) {
    const {name, value, expiry, httpOnly, expirySeconds, sessionBased } = payload;

    let expiryMs = 24 * 60 * 60 * 1000; // default 1 day
    if (expirySeconds !== undefined) {
      expiryMs = expirySeconds * 1000;
    } else if (expiry !== undefined) {
      afLogger.warn(`setCustomCookie: expiry(in ms) is deprecated, use expirySeconds instead (seconds), traceback: ${new Error().stack}`);
      expiryMs = expiry;
    }
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', 
      `adminforth_${brandSlug}_${name}=${value}; Path=${this.adminforth.config.baseUrl || '/'};${
        httpOnly ? ' HttpOnly;' : '' 
      }SameSite=Strict;${
        sessionBased ? '' : `Expires=${new Date(Date.now() + expiryMs).toUTCString() }`
      }`
    );
  }

  getCustomCookie({ cookies, name }: {
    cookies: {key: string, value: string}[], name: string
  }): string | null {
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    return cookies.find((cookie) => cookie.key === `adminforth_${brandSlug}_${name}`)?.value || null;
  }
 
  issueJWT(payload: Object, type: string, expiresIn: string | number = '24h'): string {
    // read ADMINFORH_SECRET from environment if not drop error
    const secret = process.env.ADMINFORTH_SECRET;
    if (!secret) {
      throw new Error('ADMINFORTH_SECRET environment not set');
    }

    // issue JWT token
    return jwt.sign({...payload, t: type}, secret, { expiresIn });
  }

  async verify(jwtToken: string, mustHaveType: string, decodeUser: boolean | undefined = true): Promise<Object> {
    // read ADMINFORH_SECRET from environment if not drop error
    const secret = process.env.ADMINFORTH_SECRET;
    if (!secret) {
      throw new Error('ADMINFORTH_SECRET environment not set');
    }
    let decoded;
    try {
      // verify JWT token
      decoded = jwt.verify(jwtToken, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        afLogger.info(`Token expired: ${err.message}`);
      } else  if (err.name === 'JsonWebTokenError') {
        afLogger.info(`Token error: ${err.message}, JWT secret changed?`);
      } else {
        afLogger.error(`Failed to verify JWT token: ${err}`);
      }
      return null;
    }
    const { pk, t } = decoded;
    if (t !== mustHaveType) {
      afLogger.error(`Invalid token type during verification: ${t}, must be ${mustHaveType}`);
      return null;
    }
    if (decodeUser !== false) {
      const dbUser = await this.adminforth.getUserByPk(pk);
      if (!dbUser) {
        afLogger.error(`User with pk ${pk} not found in database`);
        // will logout user which was deleted
        return null;
      }
      decoded.dbUser = dbUser;
    }
    
    return decoded;
  }

  static async generatePasswordHash(password) {
    const salt = generateSalt();
    const hashedPassword = await calcPasswordHash(password, salt);
    return `${salt}:${hashedPassword}`;
  }

  static async verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const newHash = await calcPasswordHash(password, salt);
    return newHash === hash;
  }


}

export default AdminForthAuth;