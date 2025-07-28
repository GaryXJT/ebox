# EBox 模块说明文档

## 1. 模块概述

EBox 模块是一个智能箱体管理系统的核心业务模块，主要用于管理和监控智能箱体设备。该模块提供了箱体管理、位置追踪、电子围栏、设备监控等功能。

## 2. 目录结构

```
ebox/
├── consts/        # 常量定义
├── controller/    # 控制器层，处理HTTP请求
├── dao/          # 数据访问层，处理数据库操作
├── logic/        # 业务逻辑层
├── model/        # 数据模型定义
├── router/       # 路由配置
└── service/      # 服务层，对外提供接口
```

## 3. 核心功能

### 3.1 箱体管理 (eboxBoxes)

管理智能箱体的基本信息和状态。

- 箱体属性：
  - ID：唯一标识
  - UUID：硬件 ID
  - 名称：箱体名称
  - 类型：1=拉杆箱，2=手提箱
  - 电量：支持显示充电状态
  - 位置：GeoJSON 格式
  - 锁状态：0=未锁，1=已锁
  - 蓝牙状态：0=未连接，1=已连接
  - 激活状态：0=待激活，1=已激活

### 3.2 IoT 通信 (eboxIot)

处理与箱体设备的实时通信。

- 位置更新
- 状态同步
- 电量监控
- 锁状态管理

### 3.3 轨迹记录 (eboxBoxPoints)

记录箱体的位置轨迹信息。

- 30 秒记录一次位置
- 支持轨迹回放
- 位置点管理

### 3.4 电子围栏 (eboxFences)

管理地理围栏功能。

- 围栏创建和管理
- 支持多种围栏形状
- 进出围栏检测
- 批量导入导出

## 4. API 接口

### 4.1 箱体管理接口

#### 4.1.1 获取箱体列表

```
GET /api/v1/ebox/eboxBoxes/list

请求参数：
{
    "pageNum": int,    // 页码，从1开始
    "pageSize": int,   // 每页数量
    "id": string,      // 可选，箱体ID
    "uuid": string,    // 可选，硬件ID
    "name": string,    // 可选，支持模糊查询
    "type": string,    // 可选，设备形态：1=拉杆，2=手提
    "soc": string,     // 可选，电量筛选
    "stat": string,    // 可选，状态：0=待激活，1=已激活
    "remarks": string  // 可选，备注信息
}

响应数据：
{
    "code": 0,
    "message": "success",
    "data": {
        "total": int,           // 总记录数
        "currentPage": int,     // 当前页码
        "list": [{
            "id": int,         // 箱体ID
            "uuid": string,    // 硬件ID
            "name": string,    // 名称
            "type": int,       // 设备形态
            "soc": int,        // 电量
            "position": {      // GeoJSON格式位置信息
                "type": "Point",
                "coordinates": [longitude, latitude]
            },
            "lockStat": int,   // 锁状态
            "btStat": int,     // 蓝牙状态
            "stat": int,       // 激活状态
            "remarks": string  // 备注
        }]
    }
}
```

#### 4.1.2 添加箱体

```
POST /api/v1/ebox/eboxBoxes/add

请求参数：
{
    "uuid": string,    // 必填，硬件ID
    "name": string,    // 必填，名称
    "type": int,       // 必填，设备形态：1=拉杆，2=手提
    "soc": int,        // 必填，电量
    "position": {      // 必填，GeoJSON格式位置信息
        "type": "Point",
        "coordinates": [longitude, latitude]
    },
    "remarks": string  // 可选，备注
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

#### 4.1.3 修改箱体

```
PUT /api/v1/ebox/eboxBoxes/edit

请求参数：
{
    "id": int,         // 必填，箱体ID
    "name": string,    // 可选，名称
    "type": int,       // 可选，设备形态
    "soc": int,        // 可选，电量
    "position": {      // 可选，GeoJSON格式位置信息
        "type": "Point",
        "coordinates": [longitude, latitude]
    },
    "remarks": string  // 可选，备注
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

### 4.2 IoT 设备接口

#### 4.2.1 更新位置信息

```
PUT /api/v1/ebox/eboxIot/position

请求参数：
{
    "uuid": string,    // 必填，硬件ID
    "position": {      // 必填，GeoJSON格式位置信息
        "type": "Point",
        "coordinates": [longitude, latitude]
    }
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

#### 4.2.2 更新状态信息

```
PUT /api/v1/ebox/eboxIot/status

请求参数：
{
    "uuid": string,     // 必填，硬件ID
    "soc": int,         // 必填，电量
    "lockStat": int,    // 必填，锁状态
    "btStat": int       // 必填，蓝牙状态
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

### 4.3 轨迹点接口

#### 4.3.1 获取轨迹点列表

```
GET /api/v1/ebox/eboxBoxPoints/list

请求参数：
{
    "pageNum": int,     // 页码，从1开始
    "pageSize": int,    // 每页数量
    "boxId": int,       // 必填，箱体ID
    "startTime": int64, // 可选，开始时间戳
    "endTime": int64    // 可选，结束时间戳
}

响应数据：
{
    "code": 0,
    "message": "success",
    "data": {
        "total": int,           // 总记录数
        "currentPage": int,     // 当前页码
        "list": [{
            "id": int,         // 轨迹点ID
            "boxId": int,      // 箱体ID
            "position": {      // GeoJSON格式位置信息
                "type": "Point",
                "coordinates": [longitude, latitude]
            },
            "time": int64      // 记录时间戳
        }]
    }
}
```

### 4.4 电子围栏接口

#### 4.4.1 获取围栏列表

```
GET /api/v1/ebox/eboxFences/list

请求参数：
{
    "pageNum": int,    // 页码，从1开始
    "pageSize": int,   // 每页数量
    "name": string,    // 可选，围栏名称，支持模糊查询
    "type": int        // 可选，围栏类型
}

响应数据：
{
    "code": 0,
    "message": "success",
    "data": {
        "total": int,           // 总记录数
        "currentPage": int,     // 当前页码
        "list": [{
            "id": int,         // 围栏ID
            "name": string,    // 围栏名称
            "type": int,       // 围栏类型
            "geometry": {      // GeoJSON格式围栏形状
                "type": "Polygon",
                "coordinates": [[[longitude, latitude], ...]]
            },
            "remarks": string  // 备注
        }]
    }
}
```

#### 4.4.2 添加围栏

```
POST /api/v1/ebox/eboxFences/add

请求参数：
{
    "name": string,    // 必填，围栏名称
    "type": int,       // 必填，围栏类型
    "geometry": {      // 必填，GeoJSON格式围栏形状
        "type": "Polygon",
        "coordinates": [[[longitude, latitude], ...]]
    },
    "remarks": string  // 可选，备注
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

#### 4.4.3 修改围栏

```
PUT /api/v1/ebox/eboxFences/edit

请求参数：
{
    "id": int,        // 必填，围栏ID
    "name": string,    // 必填，围栏名称
    "type": int,       // 必填，围栏类型
    "geometry": {      // 必填，GeoJSON格式围栏形状
        "type": "Polygon",
        "coordinates": [[[longitude, latitude], ...]]
    },
    "remarks": string  // 可选，备注
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

### 4.5 用户-箱体关联接口

#### 4.5.1 获取用户关联的箱体

```
GET /api/v1/ebox/eboxUserBox/get?userid={userId}

请求参数：
- userid: int  // 必填，用户ID

响应数据：
{
    "code": 0,
    "message": "success",
    "data": [{
        "id": int,          // 关联关系ID
        "userId": int,      // 用户ID
        "eboxId": int,      // 箱体ID
        "createdAt": int64, // 创建时间
        "updatedAt": int64  // 更新时间
    }]
}
```

#### 4.5.2 获取箱体关联的用户

```
GET /api/v1/ebox/eboxUserBox/get?eboxid={eboxId}

请求参数：
- eboxid: int  // 必填，箱体ID

响应数据：
{
    "code": 0,
    "message": "success",
    "data": {
        "id": int,          // 关联关系ID
        "userId": int,      // 用户ID
        "eboxId": int,      // 箱体ID
        "createdAt": int64, // 创建时间
        "updatedAt": int64  // 更新时间
    }
}
```

#### 4.5.3 解除用户-箱体关联

```
DELETE /api/v1/ebox/eboxUserBox/delete

请求参数：
{
    "ids": [int]  // 必填，要解除的关联关系ID数组
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

#### 4.5.4 添加用户-箱体关联

```
POST /api/v1/ebox/eboxUserBox/add

请求参数：
{
    "userId": int,  // 必填，用户ID
    "eboxId": int   // 必填，箱体ID
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

### 4.6 围栏-箱体关联接口

#### 4.6.1 获取箱体关联的围栏

```
GET /api/v1/ebox/eboxFenceBox/get?eboxid={eboxId}

请求参数：
- eboxid: int  // 必填，箱体ID

响应数据：
{
    "code": 0,
    "message": "success",
    "data": [{
        "id": int,          // 关联关系ID
        "fenceId": int,     // 围栏ID
        "eboxId": int,      // 箱体ID
        "createdAt": int64, // 创建时间
        "updatedAt": int64  // 更新时间
    }]
}
```

#### 4.6.2 解除围栏-箱体关联

```
DELETE /api/v1/ebox/eboxFenceBox/delete

请求参数：
{
    "ids": [int]  // 必填，要解除的关联关系ID数组
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

#### 4.6.3 添加围栏-箱体关联

```
POST /api/v1/ebox/eboxFenceBox/add

请求参数：
{
    "fenceId": int,  // 必填，围栏ID
    "eboxId": int    // 必填，箱体ID
}

响应数据：
{
    "code": 0,
    "message": "success"
}
```

## 5. 错误码说明

```
0: 成功
1: 未知错误
1001: 参数错误
1002: 数据不存在
1003: 权限不足
1004: 操作失败
2001: 设备离线
2002: 设备未激活
2003: 设备已锁定
3001: 位置数据无效
3002: 围栏数据无效
```

## 5. 数据模型

### 5.1 箱体模型 (EboxBoxes)

```go
type EboxBoxes struct {
    Id         int              // 箱体ID
    Uuid       string           // 硬件ID
    Name       string           // 名称
    Type       int              // 设备类型
    Soc        int              // 电量
    Position   geojson.Geometry // 位置
    LockStat   int              // 锁状态
    BTStat     int              // 蓝牙状态
    Stat       int              // 激活状态
    Remarks    string           // 备注
}
```

### 5.2 轨迹点模型 (EboxBoxPoints)

```go
type EboxBoxPoints struct {
    Id       int              // 主键
    BoxId    int              // 箱体ID
    Position geojson.Geometry // 位置
    Time     int64            // 记录时间
}
```

## 6. 开发说明

### 6.1 代码规范

- 遵循 Go 语言标准编码规范
- 使用统一的错误处理机制
- 必须添加中文注释

### 6.2 数据库操作

- 使用 ORM 框架
- 支持事务处理
- 字段验证必须

### 6.3 接口规范

- RESTful 风格
- 统一的返回格式
- 必要的参数验证

## 7. 注意事项

1. 位置信息使用 GeoJSON 格式
2. 时间戳使用 Unix 时间戳
3. 必须处理并发情况
4. 注意数据安全性
5. 保持日志记录完整

## 8. 依赖服务

- MySQL 数据库
- Redis 缓存（可选）
- 文件存储服务

## 9. 部署说明

1. 确保配置文件正确
2. 检查数据库连接
3. 验证权限设置
4. 测试 IoT 通信
5. 确认地理信息服务
