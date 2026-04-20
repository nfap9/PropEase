const API_URL = 'http://81.71.23.198/api/v1';

// 测试数据
const testData = {
  phone: `138${Date.now().toString().slice(-8)}`,
  password: 'Test1234ab',
  fullName: '测试用户',
  apartmentName: `测试公寓${Date.now().toString().slice(-6)}`,
  roomNumber: '101',
  rentPrice: 2000,
  waterBase: 50,
  electricBase: 100,
};

let orgId: string;
let apartmentId: string;

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function login() {
  console.log('📱 登录/注册...');
  
  // 先尝试注册
  const registerRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      phone: testData.phone,
      password: testData.password,
      full_name: testData.fullName,
    }),
  });
  
  if (registerRes.status !== 201 && registerRes.data.code !== 0) {
    console.log('用户已存在，尝试登录...');
  } else {
    console.log('✅ 注册成功');
  }
  
  // 登录获取 token
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      phone: testData.phone,
      password: testData.password,
    }),
  });
  
  if (!loginRes.data.data?.access_token) {
    throw new Error('登录失败: ' + JSON.stringify(loginRes.data));
  }
  console.log('✅ 登录成功');
  return loginRes.data.data.access_token;
}

async function createOrganizationAndApartment(token: string) {
  console.log('🏢 创建组织...');
  
  // 先创建组织
  const orgRes = await apiRequest('/organizations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: `团队-${testData.apartmentName}`,
    }),
  });
  
  if (!orgRes.data.data?.id) {
    throw new Error('创建组织失败: ' + JSON.stringify(orgRes.data));
  }
  orgId = orgRes.data.data.id;
  console.log(`✅ 组织创建成功 (ID: ${orgId})`);
  
  // 在组织下创建公寓
  console.log('🏠 创建公寓...');
  const apartmentRes = await apiRequest(`/apartments?org_id=${orgId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: testData.apartmentName,
    }),
  });
  
  if (apartmentRes.data.data?.id) {
    apartmentId = apartmentRes.data.data.id;
    console.log(`✅ 公寓创建成功: ${testData.apartmentName} (ID: ${apartmentId})`);
    return apartmentId;
  }
  throw new Error('创建公寓失败: ' + JSON.stringify(apartmentRes.data));
}

async function addRoom(token: string) {
  console.log('🚪 添加房间...');
  
  const res = await apiRequest(`/apartments/${apartmentId}/rooms?org_id=${orgId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      room_number: testData.roomNumber,
      floor: 1,
      area: 30,
    }),
  });
  
  console.log('Room API response:', JSON.stringify(res));
  
  if (res.data.data?.id) {
    console.log(`✅ 房间创建成功: ${testData.roomNumber} (ID: ${res.data.data.id})`);
    return res.data.data.id;
  }
  throw new Error('创建房间失败: ' + JSON.stringify(res.data));
}

async function configurePricing(token: string, roomId: string) {
  console.log('💰 配置价格...');
  
  const res = await apiRequest(`/rooms/${roomId}/pricing?org_id=${orgId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      rent_price: testData.rentPrice,
      water_base_price: testData.waterBase,
      electric_base_price: testData.electricBase,
    }),
  });
  
  console.log('✅ 价格配置成功');
  return res.data.data;
}

async function createLease(token: string, roomId: string) {
  console.log('📝 创建租约...');
  
  // 创建租客
  const tenantRes = await apiRequest(`/tenants?org_id=${orgId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: '张三',
      phone: `139${Date.now().toString().slice(-8)}`,
    }),
  });
  
  const tenantId = tenantRes.data.data?.id;
  if (!tenantId) throw new Error('创建租客失败: ' + JSON.stringify(tenantRes.data));
  console.log(`✅ 租客创建成功 (ID: ${tenantId})`);
  
  // 创建租约
  const leaseRes = await apiRequest('/leases', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
    body: JSON.stringify({
      room_id: roomId,
      tenant_id: tenantId,
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      monthly_rent: testData.rentPrice,
      deposit: testData.rentPrice * 2,
    }),
  });
  
  if (leaseRes.data.data?.id) {
    console.log(`✅ 租约创建成功 (ID: ${leaseRes.data.data.id})`);
    return leaseRes.data.data.id;
  }
  throw new Error('创建租约失败: ' + JSON.stringify(leaseRes.data));
}

async function recordUtilities(token: string, leaseId: string, roomId: string) {
  console.log('📊 录入水电...');
  
  const res = await apiRequest('/utility-readings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
    body: JSON.stringify({
      room_id: roomId,
      lease_id: leaseId,
      period_year: 2026,
      period_month: 4,
      water_reading: 120,
      electricity_reading: 350,
    }),
  });
  
  console.log('✅ 水电录入成功');
  return res.data.data;
}

async function generateBills(token: string) {
  console.log('🧾 生成账单...');
  
  const res = await apiRequest(`/bills/generate?org_id=${orgId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      bill_year: 2026,
      bill_month: 4,
      due_date: '2026-04-30',
    }),
  });
  
  console.log(`✅ 账单生成成功 (创建: ${res.data.data?.created || 0}, 跳过: ${res.data.data?.skipped || 0})`);
  return res.data.data;
}

async function getBillAndPay(token: string) {
  console.log('💳 查看账单并收款...');
  
  // 获取账单列表
  const billsRes = await apiRequest(`/bills?org_id=${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const bills = billsRes.data.data || [];
  if (bills.length === 0) {
    console.log('⚠️ 暂无账单');
    return;
  }
  
  const bill = bills[0];
  console.log(`📋 账单: ${bill.bill_year}-${bill.bill_month}, 总金额: ¥${bill.total_amount}, 已付: ¥${bill.paid_amount}`);
  
  if (bill.status !== 'paid') {
    // 收款 - 先尝试获取账单详情看需要什么格式
    console.log('尝试收款，账单ID:', bill.id);
    
    // 测试用最小数据
    const payRes = await apiRequest(`/bills/${bill.id}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
      body: JSON.stringify({
        amount: 100,
        payment_date: '2026-04-19',
      }),
    });
    
    console.log('Payment response:', JSON.stringify(payRes));
    
    if (payRes.data.code === 0 || payRes.status === 201) {
      console.log('✅ 收款成功');
    } else {
      console.log('❌ 收款失败:', payRes.data.message || payRes.data);
    }
  }
}

async function runE2ETest() {
  console.log('===========================================');
  console.log('  Apartment Ultra E2E 测试');
  console.log('===========================================\n');
  
  try {
    // 1. 登录/注册
    const token = await login();
    
    // 2. 创建组织和公寓
    await createOrganizationAndApartment(token);
    
    // 3. 添加房间
    const roomId = await addRoom(token);
    
    // 4. 配置价格
    await configurePricing(token, roomId);
    
    // 5. 创建租约
    const leaseId = await createLease(token, roomId);
    
    // 6. 录入水电
    await recordUtilities(token, leaseId, roomId);
    
    // 7. 生成账单
    await generateBills(token);
    
    // 8. 查看并收款
    await getBillAndPay(token);
    
    console.log('\n===========================================');
    console.log('  ✅ E2E 测试全部完成！');
    console.log('===========================================');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runE2ETest();
