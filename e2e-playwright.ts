import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://81.71.23.198/tenant';
const testPhone = `138${Date.now().toString().slice(-8)}`;
const testPassword = 'Test1234ab';

let browser: Browser;
let page: Page;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPlaywrightTest() {
  console.log('===========================================');
  console.log('  Apartment Ultra Playwright E2E 测试');
  console.log('===========================================\n');
  
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  
  try {
    // 1. 打开租客端
    console.log('🌐 打开租客端...');
    await page.goto(BASE_URL);
    await sleep(2000);
    console.log('✅ 页面加载成功');
    
    // 2. 注册/登录
    console.log('📱 注册/登录...');
    
    // 检查是否已有登录表单
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="手机"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await phoneInput.isVisible({ timeout: 3000 })) {
      // 注册
      await phoneInput.fill(testPhone);
      await passwordInput.fill(testPassword);
      
      // 点击注册
      const registerBtn = page.locator('button:has-text("注册"), button:has-text("Sign up")').first();
      if (await registerBtn.isVisible({ timeout: 3000 })) {
        await registerBtn.click();
        await sleep(2000);
      }
      
      // 重新尝试登录
      await phoneInput.fill(testPhone);
      await passwordInput.fill(testPassword);
      const loginBtn = page.locator('button:has-text("登录"), button:has-text("Login"), button:has-text("登 录")').first();
      if (await loginBtn.isVisible({ timeout: 3000 })) {
        await loginBtn.click();
        await sleep(3000);
      }
    }
    
    console.log('✅ 登录完成');
    
    // 3. 创建公寓
    console.log('🏠 创建公寓...');
    await page.goto(`${BASE_URL}/apartments`);
    await sleep(2000);
    
    // 点击添加公寓按钮
    const addAptBtn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")').first();
    if (await addAptBtn.isVisible({ timeout: 3000 })) {
      await addAptBtn.click();
      await sleep(1000);
    }
    
    // 填写公寓信息
    const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="公寓"]').first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(`测试公寓${Date.now().toString().slice(-6)}`);
      
      const saveBtn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")').first();
      if (await saveBtn.isVisible({ timeout: 3000 })) {
        await saveBtn.click();
        await sleep(2000);
      }
    }
    console.log('✅ 公寓创建完成');
    
    // 4. 添加房间
    console.log('🚪 添加房间...');
    await page.goto(`${BASE_URL}/rooms`);
    await sleep(2000);
    
    const addRoomBtn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")').first();
    if (await addRoomBtn.isVisible({ timeout: 3000 })) {
      await addRoomBtn.click();
      await sleep(1000);
      
      // 填写房间号
      const roomNumInput = page.locator('input[placeholder*="房间"], input[placeholder*="房号"]').first();
      if (await roomNumInput.isVisible({ timeout: 3000 })) {
        await roomNumInput.fill('101');
        
        const saveBtn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")').first();
        if (await saveBtn.isVisible({ timeout: 3000 })) {
          await saveBtn.click();
          await sleep(2000);
        }
      }
    }
    console.log('✅ 房间添加完成');
    
    // 5. 配置价格
    console.log('💰 配置价格...');
    // 找到房间并点击配置价格
    const roomRow = page.locator('text=101').first();
    if (await roomRow.isVisible({ timeout: 3000 })) {
      await roomRow.click();
      await sleep(1000);
      
      const priceBtn = page.locator('button:has-text("价格"), button:has-text("定价")').first();
      if (await priceBtn.isVisible({ timeout: 3000 })) {
        await priceBtn.click();
        await sleep(1000);
        
        // 填写价格
        const rentInput = page.locator('input[placeholder*="租金"], input[placeholder*="租"]').first();
        if (await rentInput.isVisible({ timeout: 3000 })) {
          await rentInput.fill('2000');
        }
        
        const saveBtn = page.locator('button:has-text("保存"), button:has-text("确定")').first();
        if (await saveBtn.isVisible({ timeout: 3000 })) {
          await saveBtn.click();
          await sleep(2000);
        }
      }
    }
    console.log('✅ 价格配置完成');
    
    // 6. 创建租约
    console.log('📝 创建租约...');
    await page.goto(`${BASE_URL}/leases`);
    await sleep(2000);
    
    const addLeaseBtn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")').first();
    if (await addLeaseBtn.isVisible({ timeout: 3000 })) {
      await addLeaseBtn.click();
      await sleep(1000);
      
      // 选择房间
      const roomSelect = page.locator('input[placeholder*="房间"]').first();
      if (await roomSelect.isVisible({ timeout: 3000 })) {
        await roomSelect.click();
        await sleep(500);
        const roomOption = page.locator('div[role="option"]:has-text("101")').first();
        if (await roomOption.isVisible({ timeout: 3000 })) {
          await roomOption.click();
          await sleep(500);
        }
      }
      
      // 填写租客信息
      const nameInput = page.locator('input[placeholder*="姓名"], input[placeholder*="名字"]').first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('张三');
      }
      
      const phoneInput = page.locator('input[placeholder*="电话"], input[placeholder*="手机"]').first();
      if (await phoneInput.isVisible({ timeout: 3000 })) {
        await phoneInput.fill(`139${Date.now().toString().slice(-8)}`);
      }
      
      const saveBtn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")').first();
      if (await saveBtn.isVisible({ timeout: 3000 })) {
        await saveBtn.click();
        await sleep(2000);
      }
    }
    console.log('✅ 租约创建完成');
    
    // 7. 录入水电
    console.log('📊 录入水电...');
    await page.goto(`${BASE_URL}/utilities`);
    await sleep(2000);
    
    const addUtilityBtn = page.locator('button:has-text("添加"), button:has-text("录入"), button:has-text("新增")').first();
    if (await addUtilityBtn.isVisible({ timeout: 3000 })) {
      await addUtilityBtn.click();
      await sleep(1000);
      
      // 选择房间
      const roomSelect = page.locator('input[placeholder*="房间"]').first();
      if (await roomSelect.isVisible({ timeout: 3000 })) {
        await roomSelect.click();
        await sleep(500);
        const roomOption = page.locator('div[role="option"]:has-text("101")').first();
        if (await roomOption.isVisible({ timeout: 3000 })) {
          await roomOption.click();
          await sleep(500);
        }
      }
      
      // 填写水表读数
      const waterInput = page.locator('input[placeholder*="水"], input[placeholder*="water"]').first();
      if (await waterInput.isVisible({ timeout: 3000 })) {
        await waterInput.fill('120');
      }
      
      // 填写电表读数
      const elecInput = page.locator('input[placeholder*="电"], input[placeholder*="electric"]').first();
      if (await elecInput.isVisible({ timeout: 3000 })) {
        await elecInput.fill('350');
      }
      
      const saveBtn = page.locator('button:has-text("保存"), button:has-text("确定")').first();
      if (await saveBtn.isVisible({ timeout: 3000 })) {
        await saveBtn.click();
        await sleep(2000);
      }
    }
    console.log('✅ 水电录入完成');
    
    // 8. 生成账单
    console.log('🧾 生成账单...');
    await page.goto(`${BASE_URL}/bills`);
    await sleep(2000);
    
    const generateBtn = page.locator('button:has-text("生成"), button:has-text("创建"), button:has-text("计账")').first();
    if (await generateBtn.isVisible({ timeout: 3000 })) {
      await generateBtn.click();
      await sleep(2000);
      
      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("确定"), button:has-text("生成")').first();
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();
        await sleep(2000);
      }
    }
    console.log('✅ 账单生成完成');
    
    // 9. 收款
    console.log('💳 收款...');
    // 刷新账单列表
    await page.goto(`${BASE_URL}/bills`);
    await sleep(2000);
    
    // 点击账单行查看详情
    const billRow = page.locator('tbody tr').first();
    if (await billRow.isVisible({ timeout: 3000 })) {
      await billRow.click();
      await sleep(1000);
      
      // 点击收款按钮
      const payBtn = page.locator('button:has-text("收款"), button:has-text("支付"), button:has-text("付款")').first();
      if (await payBtn.isVisible({ timeout: 3000 })) {
        await payBtn.click();
        await sleep(1000);
        
        // 确认收款
        const confirmBtn = page.locator('button:has-text("确认"), button:has-text("确定")').first();
        if (await confirmBtn.isVisible({ timeout: 3000 })) {
          await confirmBtn.click();
          await sleep(2000);
        }
      }
    }
    console.log('✅ 收款完成');
    
    console.log('\n===========================================');
    console.log('  ✅ Playwright E2E 测试全部完成！');
    console.log('===========================================');
    console.log('\n测试手机号:', testPhone);
    console.log('测试密码:', testPassword);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    
    // 截图保存
    await page.screenshot({ path: '/root/.openclaw/workspace/apartment-ultra/error-screenshot.png' });
    console.log('错误截图已保存到 error-screenshot.png');
    
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// 运行测试
runPlaywrightTest();
