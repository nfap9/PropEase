"""
Apartment Ultra - 租客端严谨 E2E 测试
验证每个操作的实际结果，而不仅仅是点击按钮
"""
import requests
import random

# 配置
TENANT_API = "http://81.71.23.198/api/v1"

test_phone = f"138{random.randint(10000000, 99999999)}"
test_password = "Test1234ab"

class E2EValidator:
    """验证器：确保每个操作都真正成功"""
    
    def __init__(self):
        self.token = None
        self.org_id = None
        self.apartment_id = None
        self.room_id = None
        self.lease_id = None
        self.bill_id = None
        self.tenant_id = None
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def assert_true(self, condition, message):
        if not condition:
            raise Exception(f"断言失败: {message}")
        print(f"  ✅ {message}")
    
    def assert_not_none(self, value, message):
        if value is None:
            raise Exception(f"断言失败: {message}")
        print(f"  ✅ {message}")
    
    def set_org(self, org_id):
        """设置组织ID到请求头"""
        self.org_id = org_id
        self.session.headers["x-org-id"] = org_id
    
    def api_post(self, path, data, require_auth=True):
        url = f"{TENANT_API}{path}"
        headers = {}
        if require_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        # 添加 org_id 到 query string
        if self.org_id and "org_id" not in path:
            sep = "&" if "?" in path else "?"
            url = f"{url}{sep}org_id={self.org_id}"
        resp = self.session.post(url, json=data, headers=headers, timeout=10)
        return resp.json()
    
    def api_get(self, path, require_auth=True):
        url = f"{TENANT_API}{path}"
        headers = {}
        if require_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        # 添加 org_id 到 query string
        if self.org_id and "org_id" not in path:
            sep = "&" if "?" in path else "?"
            url = f"{url}{sep}org_id={self.org_id}"
        resp = self.session.get(url, headers=headers, timeout=10)
        return resp.json()
    
    def register_and_login(self):
        """注册并登录，验证 token 真实有效"""
        print("\n📱 步骤1: 注册账号")
        
        # 注册
        result = self.api_post("/auth/register", {
            "phone": test_phone,
            "password": test_password,
            "full_name": "测试用户"
        }, require_auth=False)
        print(f"  注册: {result.get('message', result)}")
        
        # 登录
        print("  📱 登录...")
        result = self.api_post("/auth/login", {
            "phone": test_phone,
            "password": test_password
        }, require_auth=False)
        
        if result.get("code") != 0:
            raise Exception(f"登录失败: {result}")
        
        self.assert_true(result.get("code") == 0, "登录成功")
        self.token = result["data"]["access_token"]
        self.assert_not_none(self.token, "获取到 token")
        
        # 验证 token 有效
        me = self.api_get("/auth/me")
        self.assert_true(me.get("code") == 0, "Token 验证成功")
        self.assert_true(me["data"]["phone"] == test_phone, "用户手机号匹配")
        
        return True
    
    def create_organization_and_apartment(self):
        """创建组织和公寓"""
        print("\n🏢 步骤2: 创建组织和公寓")
        
        # 创建组织
        print("  创建组织...")
        result = self.api_post("/organizations", {"name": f"测试组织{random.randint(100000, 999999)}"}, require_auth=True)
        
        if result.get("code") != 0:
            raise Exception(f"创建组织失败: {result}")
        
        self.assert_true(result.get("code") == 0, "组织创建成功")
        self.org_id = result["data"]["id"]
        self.assert_not_none(self.org_id, "获取组织ID")
        
        # 更新 session headers 中的 org_id
        self.session.headers["x-org-id"] = self.org_id
        
        # 在组织下创建公寓
        print("  创建公寓...")
        result = self.api_post("/apartments", {
            "name": f"测试公寓{random.randint(100000, 999999)}"
        })
        
        if result.get("code") != 0:
            raise Exception(f"创建公寓失败: {result}")
        
        self.assert_true(result.get("code") == 0, "公寓创建成功")
        self.apartment_id = result["data"]["id"]
        self.assert_not_none(self.apartment_id, "获取公寓ID")
        
        # 验证公寓存在于列表
        result = self.api_get("/apartments")
        apartments = result.get("data", [])
        found = any(a["id"] == self.apartment_id for a in apartments)
        self.assert_true(found, "公寓出现在列表中")
        
        return True
    
    def add_room(self):
        """添加房间"""
        print("\n🚪 步骤3: 添加房间（包含租金）")
        
        print("  添加房间...")
        result = self.api_post(f"/apartments/{self.apartment_id}/rooms", {
            "room_number": "101",
            "floor": 1,
            "area": 30,
            "monthly_rent": 2000  # 房间租金
        })
        
        if result.get("code") != 0:
            raise Exception(f"添加房间失败: {result}")
        
        self.assert_true(result.get("code") == 0, "房间创建成功")
        self.room_id = result["data"]["id"]
        self.assert_not_none(self.room_id, "获取房间ID")
        
        # 验证房间存在于列表
        result = self.api_get(f"/apartments/{self.apartment_id}/rooms")
        rooms = result.get("data", [])
        found = any(r["id"] == self.room_id for r in rooms)
        self.assert_true(found, "房间出现在列表中")
        
        room = next((r for r in rooms if r["id"] == self.room_id), None)
        self.assert_true(room and room["room_number"] == "101", "房间号正确")
        
        return True
    
    def configure_pricing(self):
        """配置水电价格"""
        print("\n💰 步骤4: 配置水电价格（公寓级别）")
        
        print("  配置水电价格...")
        result = self.api_post(f"/apartments/{self.apartment_id}/utility-config", {
            "water_price_per_unit": 5,      # 水费单价
            "electricity_price_per_unit": 1,  # 电费单价
        })
        
        if result.get("code") != 0:
            raise Exception(f"配置水电价格失败: {result}")
        
        self.assert_true(result.get("code") == 0, "水电价格配置成功")
        
        # 验证配置已生效
        result = self.api_get(f"/apartments/{self.apartment_id}/utility-config")
        config = result.get("data", {})
        self.assert_true(config.get("water_price_per_unit") == 5, f"水费单价配置正确: {config.get('water_price_per_unit')}")
        self.assert_true(config.get("electricity_price_per_unit") == 1, f"电费单价配置正确: {config.get('electricity_price_per_unit')}")
        
        return True
    
    def create_lease(self):
        """创建租约"""
        print("\n📝 步骤5: 创建租约")
        
        # 创建租客
        print("  创建租客...")
        tenant_result = self.api_post("/tenants", {
            "name": "张三",
            "phone": f"139{random.randint(10000000, 99999999)}"
        })
        
        if tenant_result.get("code") != 0:
            raise Exception(f"创建租客失败: {tenant_result}")
        
        self.assert_true(tenant_result.get("code") == 0, "租客创建成功")
        self.tenant_id = tenant_result["data"]["id"]
        
        # 创建租约
        print("  创建租约...")
        result = self.api_post("/leases", {
            "room_id": self.room_id,
            "tenant_id": self.tenant_id,
            "start_date": "2026-04-01",
            "end_date": "2027-03-31",
            "monthly_rent": 2000,
            "deposit": 4000
        })
        
        if result.get("code") != 0:
            raise Exception(f"创建租约失败: {result}")
        
        self.assert_true(result.get("code") == 0, "租约创建成功")
        self.lease_id = result["data"]["id"]
        self.assert_not_none(self.lease_id, "获取租约ID")
        
        # 验证租约存在
        result = self.api_get("/leases")
        leases = result.get("data", [])
        found = any(l["id"] == self.lease_id for l in leases)
        self.assert_true(found, "租约出现在列表中")
        
        return True
    
    def record_utilities(self):
        """录入水电"""
        print("\n📊 步骤6: 录入水电")
        
        print("  录入水电...")
        result = self.api_post("/utilities", {
            "room_id": self.room_id,
            "period_year": 2026,
            "period_month": 4,
            "reading_date": "2026-04-15",
            "water_reading": 120,
            "electricity_reading": 350
        })
        
        if result.get("code") != 0:
            raise Exception(f"录入水电失败: {result}")
        
        self.assert_true(result.get("code") == 0, "水电录入成功")
        
        # 验证水电记录存在
        result = self.api_get("/utilities")
        readings = result.get("data", [])
        self.assert_true(len(readings) > 0, "水电记录存在")
        
        return True
    
    def generate_bill(self):
        """生成账单"""
        print("\n🧾 步骤7: 生成账单")
        
        print("  生成账单...")
        result = self.api_post("/bills/generate", {
            "bill_year": 2026,
            "bill_month": 4,
            "due_date": "2026-04-30"
        })
        
        if result.get("code") != 0:
            raise Exception(f"生成账单失败: {result}")
        
        self.assert_true(result.get("code") == 0, "账单生成成功")
        
        created = result.get("data", {}).get("created", 0)
        self.assert_true(created > 0, f"创建了 {created} 个账单")
        
        # 验证账单存在
        result = self.api_get("/bills")
        bills = result.get("data", [])
        self.assert_true(len(bills) > 0, "账单出现在列表中")
        
        # 获取账单详情
        self.bill_id = bills[0]["id"]
        result = self.api_get(f"/bills/{self.bill_id}")
        bill = result.get("data", {})
        total = bill.get("total_amount", 0)
        self.assert_true(float(total) > 0, f"账单有金额: ¥{total}")
        print(f"  💰 账单金额: ¥{total}")
        
        return True
    
    def payment(self):
        """收款"""
        print("\n💳 步骤8: 收款")
        
        print("  发起收款...")
        result = self.api_post(f"/bills/{self.bill_id}/payments", {
            "amount": 100,
            "payment_date": "2026-04-19",
            "payment_method": "wechat"
        })
        
        if result.get("code") != 0:
            raise Exception(f"收款失败: {result}")
        
        self.assert_true(result.get("code") == 0, "收款成功")
        
        # 验证账单状态已更新
        result = self.api_get(f"/bills/{self.bill_id}")
        bill = result.get("data", {})
        paid = float(bill.get("paid_amount", 0))
        self.assert_true(paid > 0, f"已收款金额: ¥{paid}")
        
        return True

def main():
    print("=" * 50)
    print("  Apartment Ultra 租客端 E2E 测试")
    print("=" * 50)
    
    validator = E2EValidator()
    errors = []
    passed = 0
    
    steps = [
        ("注册账号", validator.register_and_login),
        ("创建组织和公寓", validator.create_organization_and_apartment),
        ("添加房间", validator.add_room),
        ("配置水电价格", validator.configure_pricing),
        ("创建租约", validator.create_lease),
        ("录入水电", validator.record_utilities),
        ("生成账单", validator.generate_bill),
        ("收款", validator.payment),
    ]
    
    for name, func in steps:
        try:
            func()
            passed += 1
        except Exception as e:
            print(f"\n❌ {name}失败: {e}")
            errors.append(name)
    
    print("\n" + "=" * 50)
    if not errors:
        print("  ✅ 全部测试通过！")
    else:
        print(f"  ❌ {len(errors)} 步失败: {', '.join(errors)}")
    print("=" * 50)
    print(f"\n通过: {passed} / {len(steps)} 步")
    print(f"测试手机号: {test_phone}")
    print(f"测试密码: {test_password}")
    
    return 0 if not errors else 1

if __name__ == "__main__":
    exit(main())
