
import jwt from 'jsonwebtoken';

import crypto from 'crypto';

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

  issueJWT(payload) {
    // read ADMINFORH_SECRET from environment if not drop error
    const secret = process.env.ADMINFORTH_SECRET;
    if (!secret) {
      throw new Error('ADMINFORTH_SECRET environment not set');
    }

    // issue JWT token
    const expiresIn = process.env.ADMINFORTH_AUTH_EXPIRESIN || '1h';
    return jwt.sign(payload, secret, { expiresIn });
  }

  verify(jwt) {
    // read ADMINFORH_SECRET from environment if not drop error
    const secret = process.env.ADMINFORTH_SECRET;
    if (!secret) {
      throw new Error('ADMINFORTH_SECRET environment not set');
    }
    const decoded = jwt.verify(jwt, secret);
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