# API 接口文档

本文档说明所有后端 API 接口。

## 基础信息

- 基础路径：`/api/`
- 管理员接口需要通过 `X-Admin-Key` 头传递管理员密钥

## 验证码接口

### 验证验证码

验证用户输入的验证码是否有效。

**请求**

```http
POST /api/verify
Content-Type: application/json

{
  "code": "XJN64W"
}
```

**响应**

```json
// 验证码有效
{
  "valid": true
}

// 验证码无效
{
  "valid": false,
  "error": "验证码不存在"
}
```

---

### 消费验证码

用户完成测试后提交答案时调用，标记验证码为已使用。

**请求**

```http
POST /api/consume
Content-Type: application/json

{
  "code": "XJN64W",
  "result": {
    "type": "降维打击型",
    "scores": {
      "A": 2,
      "B": 3,
      "C": 3,
      "D": 3,
      "E": 4
    }
  }
}
```

**响应**

```json
{
  "success": true
}

// 或
{
  "success": false,
  "error": "验证码已使用"
}
```

---

## 管理员接口

### 设置管理员

首次设置管理员密钥（只能调用一次）。

**请求**

```http
POST /api/admin/setup-admin
Content-Type: application/json

{
  "key": "your_admin_key_at_least_16_characters"
}
```

**响应**

```json
// 成功
{
  "success": true,
  "message": "管理员设置成功"
}

// 失败
{
  "error": "管理员已设置"
}
```

---

### 生成验证码

生成新的验证码。

**请求**

```http
POST /api/admin/generate
Content-Type: application/json

{
  "adminKey": "your_admin_key",
  "count": 10,
  "prefix": "A"
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| adminKey | string | 是 | 管理员密钥 |
| count | number | 否 | 生成数量，默认10 |
| prefix | string | 否 | 验证码前缀，最多2个字符 |

**响应**

```json
{
  "success": true,
  "codes": ["ABC123", "DEF456", "GHI789"]
}
```

---

### 查询统计数据

获取测试统计数据。

**请求**

```http
GET /api/stats
X-Admin-Key: your_admin_key
```

**响应**

```json
{
  "total": 100,
  "days": 15,
  "recent": [
    {
      "date": "2026-03-13",
      "total_tests": 10,
      "results_json": "{\"降维打击型\":5,\"权倾朝野型\":3,\"内卷达人型\":2}"
    }
  ],
  "codes": [
    {
      "code": "XJN64W",
      "used": 0,
      "verified_at": "2026-03-13 15:35:55",
      "used_at": null,
      "result": null,
      "created_at": "2026-03-13 15:35:08"
    }
  ]
}
```

---

### 查询单个验证码

查询特定验证码的详细信息。

**请求**

```http
GET /api/admin/code/:code
X-Admin-Key: your_admin_key
```

**响应**

```json
{
  "code": {
    "code": "XJN64W",
    "used": 1,
    "verified_at": "2026-03-13 15:35:55",
    "used_at": "2026-03-13 15:40:00",
    "result": "{\"type\":\"降维打击型\",\"scores\":{\"A\":2,\"B\":3,\"C\":3,\"D\":3,\"E\":4}}",
    "created_at": "2026-03-13 15:35:08"
  }
}
```

---

### 检查管理员状态

检查当前密钥是否为管理员。

**请求**

```http
GET /api/admin/status
X-Admin-Key: your_admin_key
```

**响应**

```json
{
  "isAdmin": true
}
```

---

## 错误码

| 错误信息 | 说明 |
|----------|------|
| 验证码不能为空 | 未提供验证码 |
| 验证码不存在 | 验证码错误 |
| 验证码已使用 | 验证码已被使用 |
| 需要管理员密钥 | 未提供管理员密钥 |
| 无效的管理员密钥 | 密钥错误 |
| 管理员已设置 | 管理员已存在 |
