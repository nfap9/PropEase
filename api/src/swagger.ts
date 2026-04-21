import swaggerJsdoc from 'swagger-jsdoc';

// Schema definitions matching the Zod schemas in lib/schemas.ts
const schemaDefinitions: Record<string, { type?: string; properties: Record<string, unknown>; required?: string[] }> = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      phone: { type: 'string' },
      full_name: { type: 'string' },
      is_active: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  Organization: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      is_personal: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  Apartment: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      organization_id: { type: 'string' },
      name: { type: 'string' },
      address: { type: 'string' },
      description: { type: 'string' },
      floors: { type: 'integer' },
      land_area: { type: 'number' },
      total_area: { type: 'number' },
      landlord_name: { type: 'string' },
      landlord_contact: { type: 'string' },
      contract_start: { type: 'string' },
      contract_end: { type: 'string' },
      landlord_rent: { type: 'number' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  ApartmentCreate: {
    type: 'object',
    required: ['name', 'address'],
    properties: {
      name: { type: 'string', description: '公寓名称' },
      address: { type: 'string', description: '公寓地址' },
      description: { type: 'string' },
      floors: { type: 'integer' },
      land_area: { type: 'number' },
      total_area: { type: 'number' },
      landlord_name: { type: 'string' },
      landlord_contact: { type: 'string' },
      contract_start: { type: 'string', format: 'date' },
      contract_end: { type: 'string', format: 'date' },
      landlord_rent: { type: 'number' },
    },
  },
  Bill: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      organization_id: { type: 'string' },
      lease_id: { type: 'string' },
      bill_year: { type: 'integer' },
      bill_month: { type: 'integer' },
      billing_period_start: { type: 'string' },
      billing_period_end: { type: 'string' },
      total_amount: { type: 'number' },
      paid_amount: { type: 'number' },
      status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'partial', 'cancelled', 'reversed'] },
      due_date: { type: 'string' },
      notes: { type: 'string' },
      reversed_by_id: { type: 'string' },
      reverses_id: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  BillCreate: {
    type: 'object',
    required: ['lease_id', 'bill_year', 'bill_month', 'due_date', 'total_amount'],
    properties: {
      lease_id: { type: 'string' },
      bill_year: { type: 'integer' },
      bill_month: { type: 'integer' },
      due_date: { type: 'string', format: 'date' },
      rent_amount: { type: 'number' },
      water_amount: { type: 'number' },
      electricity_amount: { type: 'number' },
      other_amount: { type: 'number' },
      total_amount: { type: 'number' },
      notes: { type: 'string' },
    },
  },
  BillUpdate: {
    type: 'object',
    properties: {
      rent_amount: { type: 'number' },
      water_amount: { type: 'number' },
      electricity_amount: { type: 'number' },
      other_amount: { type: 'number' },
      total_amount: { type: 'number' },
      status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'partial', 'cancelled'] },
      notes: { type: 'string' },
    },
  },
  BillPayment: {
    type: 'object',
    required: ['amount', 'payment_date'],
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      payment_date: { type: 'string', format: 'date' },
      payment_method: { type: 'string', enum: ['wechat', 'alipay', 'bank_transfer', 'cash', 'other'] },
      reference: { type: 'string' },
      notes: { type: 'string' },
    },
  },
  BillQuery: {
    type: 'object',
    properties: {
      lease_id: { type: 'string' },
      year: { type: 'integer' },
      month: { type: 'integer' },
      status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'partial', 'cancelled', 'reversed'] },
      page: { type: 'integer', default: 1 },
      pageSize: { type: 'integer', default: 20 },
    },
  },
  Error: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      businessCode: { type: 'integer' },
      fieldErrors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  TokenResponse: {
    type: 'object',
    properties: {
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
      token_type: { type: 'string', example: 'Bearer' },
    },
  },
  LoginCredentials: {
    type: 'object',
    required: ['phone'],
    properties: {
      phone: { type: 'string', description: '中国大陆手机号' },
      password: { type: 'string', description: '密码（与验证码二选一）' },
      verification_code: { type: 'string', description: '短信验证码（与密码二选一）' },
    },
  },
  RegisterData: {
    type: 'object',
    required: ['phone', 'password', 'full_name', 'verification_code'],
    properties: {
      phone: { type: 'string', description: '中国大陆手机号' },
      password: { type: 'string', description: '密码（至少8位，包含字母和数字）' },
      full_name: { type: 'string', description: '用户姓名' },
      verification_code: { type: 'string', description: '短信验证码' },
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Apartment Ultra API',
      version: '1.0.0',
      description: '公寓管理系统 API 文档',
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: '开发服务器',
      },
      {
        url: '/api/v1',
        description: '生产服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: schemaDefinitions,
    },
  },
  apis: ['./src/routes/v1/**/*.ts', './src/docs/**/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
