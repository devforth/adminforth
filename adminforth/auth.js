
import jwt from 'jsonwebtoken';

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

}

export default AdminForthAuth;