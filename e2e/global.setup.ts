/**
 * Playwright E2E 全局 Setup
 *
 * 在所有测试之前运行，确保测试数据已准备好：
 * 1. 确保测试用户已注册
 * 2. 确保测试用户有组织
 * 3. 创建测试公寓和房间
 *
 * 使用方法：
 * - pnpm test:e2e         运行所有测试（自动调用此 setup）
 */

import type { FullConfig } from '@playwright/test';
import { TEST_ACCOUNTS } from './helpers/auth';

/**
 * API 请求辅助函数
 */
async function apiRequest(
  baseURL: string,
  endpoint: string,
  method: string = 'GET',
  body?: object
) {
  // 先登录获取 token
  const loginResponse = await fetch(`${baseURL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: TEST_ACCOUNTS.owner.phone,
      password: TEST_ACCOUNTS.owner.password,
    }),
  });

  const loginData = await loginResponse.json();

  if (loginData.code !== 0 || !loginData.data?.access_token) {
    throw new Error(`登录失败: ${loginData.message || 'Unknown error'}`);
  }

  const token = loginData.data.access_token;

  // 创建组织（如果没有）
  const orgsResponse = await fetch(`${baseURL}/api/v1/organizations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const orgsData = await orgsResponse.json();
  let orgId: string | undefined;

  if (orgsData.code === 0 && orgsData.data && orgsData.data.length > 0) {
    orgId = orgsData.data[0].id;
    console.log('ℹ️  用户已有组织');
  } else {
    // 创建组织
    const createOrgResponse = await fetch(`${baseURL}/api/v1/organizations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'E2E_测试公寓',
      }),
    });

    const createOrgData = await createOrgResponse.json();
    if (createOrgData.code === 0) {
      orgId = createOrgData.data.id;
      console.log('✅ 创建了测试组织');
    }
  }

  if (!orgId) {
    throw new Error('无法获取或创建组织');
  }

  // 创建测试公寓（如果没有的话）
  const apartmentsResponse = await fetch(`${baseURL}/api/v1/apartments?org_id=${orgId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const apartmentsData = await apartmentsResponse.json();

  if (apartmentsData.code === 0 && apartmentsData.data && apartmentsData.data.length === 0) {
    // 没有公寓，创建一个
    const createAptResponse = await fetch(`${baseURL}/api/v1/apartments?org_id=${orgId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'E2E_测试公寓',
        address: 'E2E_测试地址',
      }),
    });

    const createAptData = await createAptResponse.json();

    if (createAptData.code === 0) {
      const apartmentId = createAptData.data.id;

      // 创建几个测试房间
      for (let i = 1; i <= 3; i++) {
        await fetch(`${baseURL}/api/v1/apartments/${apartmentId}/rooms?org_id=${orgId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_number: `R${Date.now().toString().slice(-4)}_${i}`,
            monthly_rent: 1000 + i * 100,
            status: 'available',
          }),
        });
      }

      console.log('✅ 创建了测试公寓和房间');
    }
  } else {
    console.log('ℹ️  测试公寓已存在');
  }
}

/**
 * 全局 Setup 函数
 */
export default async function globalSetup(config: FullConfig) {
  // API 运行在 8000 端口
  const baseURL = 'http://localhost:8000';
  console.log(`🔧 开始准备测试数据 (${baseURL})...`);

  try {
    await apiRequest(baseURL, '/api/v1/organizations');
    console.log('✅ 测试数据准备完成');
  } catch (error) {
    console.error('❌ 测试数据准备失败:', error);
    throw error;
  }
}
