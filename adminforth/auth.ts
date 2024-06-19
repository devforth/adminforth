
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

  issueJWT(payload) {
    // read ADMINFORH_SECRET from environment if not drop error
    const secret = process.env.ADMINFORTH_SECRET;
    if (!secret) {
      throw new Error('ADMINFORTH_SECRET environment not set');
    }

    // issue JWT token
    const expiresIn = process.env.ADMINFORTH_AUTH_EXPIRESIN || '24h';
    return jwt.sign(payload, secret, { expiresIn });
  }

  async verify(jwtToken) {
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
    const { pk } = decoded;
    if (pk === null) {
      decoded.isRoot = true;
    } else {
      const dbUser = await this.adminforth.getUserByPk(pk);
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