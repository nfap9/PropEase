#!/usr/bin/env tsx
/**
 * 导出 OpenAPI 规范为 JSON 文件，用于导入到 Apifox
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Apartment Ultra API',
      version: '1.0.0',
      description: '公寓管理系统 API 文档',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: '开发服务器',
      },
      {
        url: 'https://api.example.com/api/v1',
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
            description: { type: 'string' },
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
            layout: { type: 'string' },
            area: { type: 'number' },
            status: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'reserved'] },
            monthly_rent: { type: 'number' },
            notes: { type: 'string' },
            facilities: { type: 'object' },
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
            id_card: { type: 'string' },
            emergency_contact: { type: 'string' },
            emergency_phone: { type: 'string' },
            notes: { type: 'string' },
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
            billing_day: { type: 'integer' },
            monthly_rent: { type: 'number' },
            deposit: { type: 'number' },
            water_rate: { type: 'number' },
            electricity_rate: { type: 'number' },
            status: { type: 'string', enum: ['active', 'ended', 'terminated'] },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Bill: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            lease_id: { type: 'string' },
            bill_year: { type: 'integer' },
            bill_month: { type: 'integer' },
            billing_period_start: { type: 'string', format: 'date' },
            billing_period_end: { type: 'string', format: 'date' },
            due_date: { type: 'string', format: 'date' },
            rent_amount: { type: 'number' },
            water_amount: { type: 'number' },
            electricity_amount: { type: 'number' },
            other_amount: { type: 'number' },
            total_amount: { type: 'number' },
            paid_amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            bill_id: { type: 'string' },
            amount: { type: 'number' },
            payment_date: { type: 'string', format: 'date' },
            payment_method: { type: 'string' },
            reference: { type: 'string' },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
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
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        UtilityConfig: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            apartment_id: { type: 'string' },
            water_price_per_unit: { type: 'number' },
            electricity_price_per_unit: { type: 'number' },
            internet_fee: { type: 'number' },
            management_fee: { type: 'number' },
            service_fee: { type: 'number' },
            notes: { type: 'string' },
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
    tags: [
      { name: '认证', description: '用户认证相关接口' },
      { name: '公寓管理', description: '公寓与房间管理接口' },
      { name: '租客管理', description: '租客信息管理接口' },
      { name: '租约管理', description: '租约管理接口' },
      { name: '账单管理', description: '账单与支付管理接口' },
      { name: '水电管理', description: '水电读数管理接口' },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
};

const spec = swaggerJsdoc(options);

// 输出路径
const outputPath = join(__dirname, '..', 'openapi.json');

writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');

console.log(`OpenAPI 规范已导出到: ${outputPath}`);
console.log(`可以在 Apifox 中导入此文件`);
