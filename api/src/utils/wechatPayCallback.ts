import * as crypto from 'crypto';

/**
 * 解密微信支付 V3 回调 resource（AEAD_AES_256_GCM）.
 * 返回解密后的 JSON 对象，失败返回 null。
 */
export function decryptWechatPayResource(
  ciphertext: string,
  nonce: string,
  associatedData: string,
  apiv3Key: string
): Record<string, unknown> | null {
  try {
    const key = Buffer.from(apiv3Key, 'utf8');
    if (key.length !== 32) return null;
    const cipherBuf = Buffer.from(ciphertext, 'base64');
    if (cipherBuf.length < 16) return null;
    const tag = cipherBuf.subarray(-16);
    const data = cipherBuf.subarray(0, -16);
    const nonceBuf = Buffer.from(nonce, 'base64');
    const aad = Buffer.from(associatedData || '', 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBuf, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    decipher.setAAD(aad);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}
