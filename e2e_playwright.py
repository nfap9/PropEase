import asyncio
from playwright.async_api import async_playwright
import random

BASE_URL = "http://81.71.23.198/tenant"
test_phone = f"138{random.randint(10000000, 99999999)}"
test_password = "Test1234ab"

async def sleep(ms):
    await asyncio.sleep(ms / 1000)

async def run_e2e_test():
    print("===========================================")
    print("  Apartment Ultra Playwright E2E 测试")
    print("===========================================\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # 1. 打开租客端
            print("🌐 打开租客端...")
            await page.goto(BASE_URL)
            await sleep(2000)
            print("✅ 页面加载成功")
            
            # 2. 注册/登录
            print("📱 注册/登录...")
            
            # 尝试找到手机号输入框
            phone_input = page.locator('input[type="tel"], input[placeholder*="手机"], input[placeholder*="phone"]').first
            password_input = page.locator('input[type="password"]').first
            
            if await phone_input.is_visible(timeout=5000):
                # 填写注册信息
                await phone_input.fill(test_phone)
                await password_input.fill(test_password)
                
                # 点击注册按钮
                register_btn = page.locator('button:has-text("注册"), button:has-text("Sign up")').first
                if await register_btn.is_visible(timeout=3000):
                    await register_btn.click()
                    await sleep(2000)
                
                # 重新填写登录信息
                await phone_input.fill(test_phone)
                await password_input.fill(test_password)
                
                # 点击登录按钮
                login_btn = page.locator('button:has-text("登录"), button:has-text("Login"), button:has-text("登 录")').first
                if await login_btn.is_visible(timeout=3000):
                    await login_btn.click()
                    await sleep(3000)
            
            print("✅ 登录完成")
            
            # 3. 创建公寓
            print("🏠 创建公寓...")
            await page.goto(f"{BASE_URL}/apartments")
            await sleep(2000)
            
            # 点击添加公寓按钮
            add_btn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建"), button:has-text("+")').first
            if await add_btn.is_visible(timeout=3000):
                await add_btn.click()
                await sleep(1000)
                
                # 填写公寓名称
                name_input = page.locator('input[placeholder*="名称"], input[placeholder*="公寓"], input[placeholder*="name"]').first
                if await name_input.is_visible(timeout=3000):
                    await name_input.fill(f"测试公寓{random.randint(100000, 999999)}")
                    
                    # 保存
                    save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交"), button:has-text("Create")').first
                    if await save_btn.is_visible(timeout=3000):
                        await save_btn.click()
                        await sleep(2000)
            
            print("✅ 公寓创建完成")
            
            # 4. 添加房间
            print("🚪 添加房间...")
            await page.goto(f"{BASE_URL}/rooms")
            await sleep(2000)
            
            add_btn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建"), button:has-text("+")').first
            if await add_btn.is_visible(timeout=3000):
                await add_btn.click()
                await sleep(1000)
                
                # 填写房间号
                room_input = page.locator('input[placeholder*="房间"], input[placeholder*="房号"], input[placeholder*="room"]').first
                if await room_input.is_visible(timeout=3000):
                    await room_input.fill("101")
                    
                    save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交"), button:has-text("Create")').first
                    if await save_btn.is_visible(timeout=3000):
                        await save_btn.click()
                        await sleep(2000)
            
            print("✅ 房间添加完成")
            
            # 5. 配置价格
            print("💰 配置价格...")
            await page.goto(f"{BASE_URL}/rooms")
            await sleep(2000)
            
            # 点击房间行
            room_row = page.locator('text=101').first
            if await room_row.is_visible(timeout=3000):
                await room_row.click()
                await sleep(1000)
                
                # 点击配置价格
                price_btn = page.locator('button:has-text("价格"), button:has-text("定价"), button:has-text("编辑")').first
                if await price_btn.is_visible(timeout=3000):
                    await price_btn.click()
                    await sleep(1000)
                    
                    # 填写租金
                    rent_input = page.locator('input[placeholder*="租金"], input[placeholder*="租"], input[type="number"]').first
                    if await rent_input.is_visible(timeout=3000):
                        await rent_input.fill("2000")
                        
                        save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("Update")').first
                        if await save_btn.is_visible(timeout=3000):
                            await save_btn.click()
                            await sleep(2000)
            
            print("✅ 价格配置完成")
            
            # 6. 创建租约
            print("📝 创建租约...")
            await page.goto(f"{BASE_URL}/leases")
            await sleep(2000)
            
            add_btn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建"), button:has-text("+")').first
            if await add_btn.is_visible(timeout=3000):
                await add_btn.click()
                await sleep(1000)
                
                # 选择房间
                room_select = page.locator('input[placeholder*="房间"], input[placeholder*="room"], [role="combobox"]').first
                if await room_select.is_visible(timeout=3000):
                    await room_select.click()
                    await sleep(500)
                    room_option = page.locator('div[role="option"]:has-text("101"), li:has-text("101")').first
                    if await room_option.is_visible(timeout=3000):
                        await room_option.click()
                        await sleep(500)
                
                # 填写租客姓名
                name_input = page.locator('input[placeholder*="姓名"], input[placeholder*="名字"], input[placeholder*="name"]').first
                if await name_input.is_visible(timeout=3000):
                    await name_input.fill("张三")
                
                # 填写电话
                phone_input = page.locator('input[placeholder*="电话"], input[placeholder*="手机"], input[placeholder*="phone"]').first
                if await phone_input.is_visible(timeout=3000):
                    await phone_input.fill(f"139{random.randint(10000000, 99999999)}")
                
                save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交"), button:has-text("Create")').first
                if await save_btn.is_visible(timeout=3000):
                    await save_btn.click()
                    await sleep(2000)
            
            print("✅ 租约创建完成")
            
            # 7. 录入水电
            print("📊 录入水电...")
            await page.goto(f"{BASE_URL}/utilities")
            await sleep(2000)
            
            add_btn = page.locator('button:has-text("添加"), button:has-text("录入"), button:has-text("新增"), button:has-text("+")').first
            if await add_btn.is_visible(timeout=3000):
                await add_btn.click()
                await sleep(1000)
                
                # 选择房间
                room_select = page.locator('input[placeholder*="房间"], input[placeholder*="room"], [role="combobox"]').first
                if await room_select.is_visible(timeout=3000):
                    await room_select.click()
                    await sleep(500)
                    room_option = page.locator('div[role="option"]:has-text("101"), li:has-text("101")').first
                    if await room_option.is_visible(timeout=3000):
                        await room_option.click()
                        await sleep(500)
                
                # 填写水表
                water_input = page.locator('input[placeholder*="水"], input[placeholder*="water"]').first
                if await water_input.is_visible(timeout=3000):
                    await water_input.fill("120")
                
                # 填写电表
                elec_input = page.locator('input[placeholder*="电"], input[placeholder*="electric"]').first
                if await elec_input.is_visible(timeout=3000):
                    await elec_input.fill("350")
                
                save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("提交")').first
                if await save_btn.is_visible(timeout=3000):
                    await save_btn.click()
                    await sleep(2000)
            
            print("✅ 水电录入完成")
            
            # 8. 生成账单
            print("🧾 生成账单...")
            await page.goto(f"{BASE_URL}/bills")
            await sleep(2000)
            
            generate_btn = page.locator('button:has-text("生成"), button:has-text("创建"), button:has-text("计账"), button:has-text("+")').first
            if await generate_btn.is_visible(timeout=3000):
                await generate_btn.click()
                await sleep(2000)
                
                confirm_btn = page.locator('button:has-text("确认"), button:has-text("确定"), button:has-text("生成")').first
                if await confirm_btn.is_visible(timeout=3000):
                    await confirm_btn.click()
                    await sleep(2000)
            
            print("✅ 账单生成完成")
            
            # 9. 收款
            print("💳 收款...")
            await page.goto(f"{BASE_URL}/bills")
            await sleep(2000)
            
            # 点击账单行
            bill_rows = page.locator('tbody tr')
            if await bill_rows.first.is_visible(timeout=3000):
                await bill_rows.first.click()
                await sleep(1000)
                
                # 点击收款按钮
                pay_btn = page.locator('button:has-text("收款"), button:has-text("支付"), button:has-text("付款")').first
                if await pay_btn.is_visible(timeout=3000):
                    await pay_btn.click()
                    await sleep(1000)
                    
                    confirm_btn = page.locator('button:has-text("确认"), button:has-text("确定")').first
                    if await confirm_btn.is_visible(timeout=3000):
                        await confirm_btn.click()
                        await sleep(2000)
            
            print("✅ 收款完成")
            
            print("\n===========================================")
            print("  ✅ Playwright E2E 测试全部完成！")
            print("===========================================")
            print(f"\n测试手机号: {test_phone}")
            print(f"测试密码: {test_password}")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            await page.screenshot(path="/root/.openclaw/workspace/apartment-ultra/error-screenshot.png")
            print("错误截图已保存到 error-screenshot.png")
            raise
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
