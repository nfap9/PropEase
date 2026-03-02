/**
 * 扩展 Express Response.locals，支持 res.locals.successMessage（语义化成功文案）
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express 类型扩展约定
  namespace Express {
    interface Response {
      locals: Record<string, unknown> & { successMessage?: string };
    }
  }
}
export {};
