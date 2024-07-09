import * as crypto from 'crypto';
import { config } from '../config/config';

export const hashPwd = (p: string): string => {
  const hmac = crypto.createHmac('sha512', config.hmacKey);
  hmac.update(p);
  return hmac.digest('hex');
};
