
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AdminForth from './index.js';
import { IAdminForthAuth } from './types/Back.js';

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
    if (clientIpHeader) {
      return headersLower[clientIpHeader.toLowerCase()] || 'unknown';
    } else {
      // first try common headers which can't bee spoofed, in other words
      // most common to nginx/traefik/apache
      // then fallback to less secure headers
      return headersLower['x-forwarded-for']?.split(',').shift().trim() ||
       headersLower['x-real-ip'] || 
       headersLower['x-client-ip'] || 
       headersLower['x-cluster-client-ip'] || 
       headersLower['forwarded'] || 
       headersLower['remote-addr'] || 
       headersLower['client-ip'] || 
       headersLower['client-address'] || 
       headersLower['client'] || 
       headersLower['x-host'] || 
       headersLower['host'] || 
       'unknown';
    }
  }

  removeAuthCookie(response) {
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_jwt=; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }

  setAuthCookie({ expireInDays, response, username, pk}: {
    expireInDays?: number,
    response: any, 
    username: string, 
    pk: string | null
  }) {
    console.log("in days", expireInDays);
    const expiresIn: string = expireInDays ? `${expireInDays}d` : (process.env.ADMINFORTH_AUTH_EXPIRESIN || '24h');
    console.log("in string", expiresIn);
    // might be h,m,d in string

    const expiresInSec = parseTimeToSeconds(expiresIn);

    console.log("expiresInSec", expiresInSec);

    const token = this.issueJWT({ username, pk}, 'auth', expiresIn);
    console.log("token", token);
    const expiresCookieFormat = new Date(Date.now() + expiresInSec * 1000).toUTCString();
    console.log("expiresCookieFormat", expiresCookieFormat);
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    console.log("brandSlug", brandSlug);
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_jwt=${token}; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=${expiresCookieFormat}`);
  }

  removeCustomCookie({response, name}) {
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_${name}=; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }

  setCustomCookie({ response, payload }: {
    response: any, payload: { name: string, value: string, expiry: number | undefined, expirySeconds: number | undefined, httpOnly: boolean }
  }) {
    const {name, value, expiry, httpOnly, expirySeconds } = payload;

    let expiryMs = 24 * 60 * 60 * 1000; // default 1 day
    if (expirySeconds !== undefined) {
      expiryMs = expirySeconds * 1000;
    } else if (expiry !== undefined) {
      console.warn('setCustomCookie: expiry(in ms) is deprecated, use expirySeconds instead (seconds), traceback:', new Error().stack);
      expiryMs = expiry;
    }

    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    response.setHeader('Set-Cookie', `adminforth_${brandSlug}_${name}=${value}; Path=${this.adminforth.config.baseUrl || '/'};${
      httpOnly ? ' HttpOnly;' : ''
    } SameSite=Strict; Expires=${new Date(Date.now() + expiryMs).toUTCString() } `);
  }

  getCustomCookie({ cookies, name }: {
    cookies: {key: string, value: string}[], name: string
  }): string | null {
    const brandSlug = this.adminforth.config.customization.brandNameSlug;
    return cookies.find((cookie) => cookie.key === `adminforth_${brandSlug}_${name}`)?.value || null;
  }
 
  issueJWT(payload: Object, type: string, expiresIn: string = '24h'): string {
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
        console.error('Token expired:', err.message);
      } else  if (err.name === 'JsonWebTokenError') {
        console.error('Token error:', err.message);
      } else {
        console.error('Failed to verify JWT token', err);
      }
      return null;
    }
    const { pk, t } = decoded;
    if (t !== mustHaveType) {
      console.error(`Invalid token type during verification: ${t}, must be ${mustHaveType}`);
      return null;
    }
    if (decodeUser !== false) {
      const dbUser = await this.adminforth.getUserByPk(pk);
      if (!dbUser) {
        console.error(`User with pk ${pk} not found in database`);
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