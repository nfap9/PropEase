import swaggerJsdoc from 'swagger-jsdoc';

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
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
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
        TokenResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            token_type: { type: 'string', example: 'Bearer' },
          },
        },
        SendSmsCodeData: {
          type: 'object',
          required: ['phone', 'purpose'],
          properties: {
            phone: { type: 'string', description: '中国大陆手机号' },
            purpose: { type: 'string', enum: ['login', 'register'], description: '验证码用途' },
          },
        },
        Apartment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            org_id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            apartment_id: { type: 'string' },
            room_number: { type: 'string' },
            floor: { type: 'integer' },
            area: { type: 'number' },
            status: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'reserved'] },
            monthly_rent: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            id_card_number: { type: 'string' },
            emergency_contact: { type: 'string' },
            emergency_phone: { type: 'string' },
            org_id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Lease: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            room_id: { type: 'string' },
            tenant_id: { type: 'string' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            monthly_rent: { type: 'number' },
            deposit: { type: 'number' },
            status: { type: 'string', enum: ['active', 'ended', 'terminated'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Bill: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            lease_id: { type: 'string' },
            billing_period_start: { type: 'string', format: 'date' },
            billing_period_end: { type: 'string', format: 'date' },
            total_amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] },
            due_date: { type: 'string', format: 'date' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        UtilityReading: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            room_id: { type: 'string' },
            reading_date: { type: 'string', format: 'date' },
            water_reading: { type: 'number' },
            electricity_reading: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
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
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/docs/**/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
