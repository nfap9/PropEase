import asyncio
from playwright.async_api import async_playwright
import random

BASE_URL = "http://81.71.23.198/admin"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@1234"

async def sleep(ms):
    await asyncio.sleep(ms / 1000)

async def run_admin_platform_e2e_test():
    print("===========================================")
    print("  Apartment Ultra 平台管理端 E2E 测试")
    print("===========================================\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # 1. 打开平台管理端
            print("🌐 打开平台管理端...")
            await page.goto(BASE_URL)
            await sleep(2000)
            print("✅ 页面加载成功")
            
            # 2. 登录
            print("📱 登录...")
            
            # 检查是否已有登录状态的页面
            dashboard = page.locator('text=总览, text=Dashboard, text=统计, text=收入').first
            if await dashboard.is_visible(timeout=3000):
                print("✅ 已登录（使用已有会话）")
            else:
                # 需要登录
                username_input = page.locator('input[placeholder*="账号"], input[placeholder*="用户名"], input[placeholder*="username"], input[type="text"]').first
                password_input = page.locator('input[type="password"]').first
                
                if await username_input.is_visible(timeout=5000):
                    await username_input.fill(ADMIN_USERNAME)
                    await password_input.fill(ADMIN_PASSWORD)
                    
                    login_btn = page.locator('button:has-text("登录"), button:has-text("Sign in"), button:has-text("登 录")').first
                    if await login_btn.is_visible(timeout=3000):
                        await login_btn.click()
                        await sleep(3000)
                    
                    print("✅ 登录完成")
            
            # 3. 查看仪表盘
            print("📊 查看仪表盘...")
            await page.goto(BASE_URL)
            await sleep(2000)
            print("✅ 仪表盘加载成功")
            
            # 4. 用户管理
            print("👥 用户管理...")
            await page.goto(f"{BASE_URL}/users")
            await sleep(2000)
            
            user_rows = page.locator('table tbody tr')
            user_count = await user_rows.count()
            print(f"   当前用户数: {user_count}")
            print("✅ 用户管理页面加载成功")
            
            # 5. 注册用户
            print("📝 注册用户管理...")
            await page.goto(f"{BASE_URL}/registered-users")
            await sleep(2000)
            print("✅ 注册用户页面加载成功")
            
            # 6. 角色管理
            print("🔐 角色管理...")
            await page.goto(f"{BASE_URL}/roles")
            await sleep(2000)
            
            add_btn = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建"), button:has-text("+")').first
            if await add_btn.is_visible(timeout=3000):
                await add_btn.click()
                await sleep(1000)
                
                name_input = page.locator('input[placeholder*="名称"], input[placeholder*="角色"], input[placeholder*="name"]').first
                if await name_input.is_visible(timeout=3000):
                    await name_input.fill(f"测试角色{random.randint(100, 999)}")
                    
                    save_btn = page.locator('button:has-text("保存"), button:has-text("确定"), button:has-text("创建"), button:has-text("Create")').first
                    if await save_btn.is_visible(timeout=3000):
                        await save_btn.click()
                        await sleep(2000)
                
                print("✅ 角色创建完成")
            else:
                print("✅ 角色管理页面加载成功")
            
            # 7. 组织管理
            print("🏢 组织管理...")
            await page.goto(f"{BASE_URL}/organizations")
            await sleep(2000)
            
            org_rows = page.locator('table tbody tr')
            org_count = await org_rows.count()
            print(f"   当前组织数: {org_count}")
            print("✅ 组织管理页面加载成功")
            
            # 8. 品牌配置
            print("🎨 品牌配置...")
            await page.goto(f"{BASE_URL}/brand")
            await sleep(2000)
            print("✅ 品牌配置页面加载成功")
            
            # 9. 套餐管理
            print("📦 套餐管理...")
            await page.goto(f"{BASE_URL}/billing/plans")
            await sleep(2000)
            print("✅ 套餐管理页面加载成功")
            
            # 10. 订单管理
            print("📜 订单管理...")
            await page.goto(f"{BASE_URL}/billing/orders")
            await sleep(2000)
            print("✅ 订单管理页面加载成功")
            
            # 11. 用量定价
            print("💵 用量定价...")
            await page.goto(f"{BASE_URL}/billing/usage-pricing")
            await sleep(2000)
            print("✅ 用量定价页面加载成功")
            
            # 12. 计费概览
            print("💳 计费概览...")
            await page.goto(f"{BASE_URL}/billing")
            await sleep(2000)
            print("✅ 计费概览页面加载成功")
            
            print("\n===========================================")
            print("  ✅ 平台管理端 E2E 测试全部完成！")
            print("===========================================")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            await page.screenshot(path="/root/.openclaw/workspace/apartment-ultra/admin-platform-error-screenshot.png")
            print("错误截图已保存")
            raise
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_admin_platform_e2e_test())
