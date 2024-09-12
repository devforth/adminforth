
import jwt from 'jsonwebtoken';

import crypto from 'crypto';
import AdminForth from './index.js';

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

class AdminForthAuth {
  adminforth: AdminForth;

  constructor(adminforth) {
    this.adminforth = adminforth;
  }

  removeAuthCookie(response) {
    response.setHeader('Set-Cookie', `adminforth_jwt=; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }

  setAuthCookie({ response, username, pk}: {
    response: any, username: string, pk: string | null
  }) {
    const token = this.issueJWT({ username, pk, }, 'auth');
    response.setHeader('Set-Cookie', `adminforth_jwt=${token}; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict`);
  }

  removeCustomCookie({response, name}) {
    response.setHeader('Set-Cookie', `adminforth_test'='2'; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict`);
  }

  setCustomCookie({ response, payload }: {
    response: any, payload: {name: string, value: string, expiry: number, httpOnly: boolean}
  }) {
    const {name,value,expiry,httpOnly} = payload
    response.setHeader('Set-Cookie', `adminforth_${name}=${value}; Path=${this.adminforth.config.baseUrl || '/'}; HttpOnly; SameSite=Strict; Expires=${new Date(Date.now() + expiry).toUTCString() } `);
  }

 


  issueJWT(payload: Object, type: string) {
    // read ADMINFORH_SECRET from environment if not drop error
    const secret = process.env.ADMINFORTH_SECRET;
    if (!secret) {
      throw new Error('ADMINFORTH_SECRET environment not set');
    }

    // issue JWT token
    const expiresIn = process.env.ADMINFORTH_AUTH_EXPIRESIN || '24h';
    return jwt.sign({...payload, t: type}, secret, { expiresIn });
  }

  async verify(jwtToken: string, mustHaveType: string): Promise<Object> {
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
    const dbUser = await this.adminforth.getUserByPk(pk);
    if (!dbUser) {
      console.error(`User with pk ${pk} not found in database`);
      // will logout user which was deleted
      return null;
    }
    decoded.dbUser = dbUser;
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