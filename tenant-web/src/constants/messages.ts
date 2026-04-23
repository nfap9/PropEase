// Static i18n message objects used by business-layer hooks.
// Kept here so hooks can access messages without depending on the i18n infrastructure layer.
// (i18n/context.tsx lives in infrastructure layer due to React context)
export const tenantMessages = {
  bills: {
    toast: {
      paymentRecorded: '缴费记录已保存',
      exportSuccess: '账单导出成功',
      shared: '已分享账单',
      downloaded: '已下载账单',
    },
    errors: {
      payment: '保存缴费记录失败',
      generate: '生成账单失败',
      export: '导出账单失败',
      share: '分享账单失败',
    },
    paymentMethods: {
      cash: '现金',
      wechat: '微信支付',
      alipay: '支付宝',
      bankTransfer: '银行转账',
      other: '其他',
    },
  },
} as const;
