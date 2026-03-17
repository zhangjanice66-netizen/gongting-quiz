# 数据库设计

本文档说明数据库结构。

## 数据库文件

- 位置：`server/gongting.db`
- 类型：SQLite (sql.js)

## 数据表

### codes - 验证码表

存储所有验证码信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| code | TEXT | 验证码（主键），6位随机字符 |
| used | INTEGER | 是否已使用（0=未使用，1=已使用） |
| verified_at | TEXT | 首次验证时间（输入验证码时） |
| used_at | TEXT | 提交时间（完成测试时） |
| result | TEXT | 测试结果（JSON格式） |
| created_at | TEXT | 创建时间 |

**result 字段格式**

```json
{
  "type": "降维打击型",
  "scores": {
    "A": 2,
    "B": 3,
    "C": 3,
    "D": 3,
    "E": 4
  }
}
```

---

### stats - 统计表

存储每日统计数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 日期（格式：YYYY-MM-DD） |
| total_tests | INTEGER | 当日测试总次数 |
| results_json | TEXT | 测试结果分布（JSON格式） |

**results_json 字段格式**

```json
{
  "降维打击型": 5,
  "权倾朝野型": 3,
  "内卷达人型": 2
}
```

---

### admin_keys - 管理员表

存储管理员密钥。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| key | TEXT | 管理员密钥（唯一） |
| created_at | TEXT | 创建时间 |

---

## 验证码生命周期

```
创建 → 输入（verified_at） → 提交（used_at）
```

1. **创建**：管理员生成验证码，存储在 codes 表
2. **输入**：用户输入验证码，系统记录 verified_at 时间戳
3. **提交**：用户完成测试，系统记录 used_at 和 result

---

## SQL 查询示例

### 查询今日统计

```sql
SELECT * FROM stats WHERE date = date('now', 'localtime');
```

### 查询未使用的验证码数量

```sql
SELECT COUNT(*) as unused FROM codes WHERE used = 0;
```

### 查询验证码详情

```sql
SELECT * FROM codes WHERE code = 'XJN64W';
```
