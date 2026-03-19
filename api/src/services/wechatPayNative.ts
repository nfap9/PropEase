import * as crypto from 'crypto';
import * as fs from 'fs';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

const WECHAT_PAY_BASE = 'https://api.mch.weixin.qq.com';
const NATIVE_PATH = '/v3/pay/transactions/native';

function loadPrivateKey(): string {
  if (config.wechatPrivateKeyPath) {
    return fs.readFileSync(config.wechatPrivateKeyPath, 'utf8');
  }
  return config.wechatPrivateKey ?? '';
}

/**
 * 生成微信支付 V3 请求签名。
 * 签名字符串：METHOD + \n + URL + \n + timestamp + \n + nonce + \n + body + \n
 */
function signRequest(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  body: string,
  privateKeyPem: string
): string {
  const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  return sign.sign(privateKeyPem, 'base64');
}

/**
 * 生成 Authorization 头
 */
function buildAuthorization(method: string, path: string, body: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const privateKeyPem = loadPrivateKey();
  const signature = signRequest(method, path, timestamp, nonce, body, privateKeyPem);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechatMchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.wechatCertSerialNo}",signature="${signature}"`;
}

export interface CreateNativeOrderParams {
  /** 商户订单号，与本地 SubscriptionOrder.order_no 一致 */
  out_trade_no: string;
  /** 商品描述，用户账单可见 */
  description: string;
  /** 金额（元），将转为分 */
  amount_yuan: number;
  /** 支付截止时间（可选），ISO 8601 */
  time_expire?: string;
}

export interface NativeOrderResult {
  code_url: string;
}

/**
 * 调用微信支付 Native 下单接口，返回用于生成二维码的 code_url。
 * 仅在 config.wechatPayEnabled 且必要配置齐全时可用。
 */
export async function createWechatPayNativeOrder(
  params: CreateNativeOrderParams
): Promise<NativeOrderResult | null> {
  if (
    !config.wechatPayEnabled ||
    !config.wechatMchId ||
    !config.wechatAppId ||
    !config.wechatCertSerialNo ||
    (!config.wechatPrivateKey && !config.wechatPrivateKeyPath)
  ) {
    return null;
  }

  const notifyUrl = config.wechatPayNotifyUrlBase
    ? `${config.wechatPayNotifyUrlBase.replace(/\/$/, '')}/api/v1/webhooks/wechat-pay`
    : '';
  if (!notifyUrl) return null;

  const totalFen = Math.round(params.amount_yuan * 100);
  if (totalFen <= 0) return null;

  const bodyObj: Record<string, unknown> = {
    appid: config.wechatAppId,
    mchid: config.wechatMchId,
    description: params.description.slice(0, 127),
    out_trade_no: params.out_trade_no,
    notify_url: notifyUrl,
    amount: { total: totalFen, currency: 'CNY' },
  };
  if (params.time_expire) {
    bodyObj.time_expire = params.time_expire;
  }
  const body = JSON.stringify(bodyObj);

  const auth = buildAuthorization('POST', NATIVE_PATH, body);
  const url = `${WECHAT_PAY_BASE}${NATIVE_PATH}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error({ status: res.status, errText }, 'WeChat Pay Native order failed');
    return null;
  }

  const data = (await res.json()) as { code_url?: string };
  if (data?.code_url) {
    return { code_url: data.code_url };
  }
  return null;
}
