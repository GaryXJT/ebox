// 箱体基础信息接口
export interface BoxInfo {
	id: number; // 箱体ID
	uuid: string; // 硬件ID
	name: string; // 名称
	type: number; // 设备形态：1=拉杆，2=手提
	soc: number; // 电量
	position: {
		// GeoJSON格式位置信息
		type: 'Point';
		coordinates: [number, number]; // [经度, 纬度]
	};
	lock_stat: number; // 锁状态：0=未锁，1=已锁
	bt_stat: number; // 蓝牙状态：0=未连接，1=已连接
	stat: number; // 激活状态：0=待激活，1=已活
	remarks: string; // 备注
	created_at: string; // 创建时间
	updated_at: string; // 更新时间
	bindUser?: {
		// 绑定的用户信息
		id: number; // 用户ID
		name: string; // 用户名称
		dept: string; // 部门名称
	};
}

// 箱体列表查询参数接口
export interface BoxQueryParams {
	pageNum: number; // 页码，从1开始
	pageSize: number; // 每页数量
	boxId?: string; // 可选，箱体编号
	id?: string; // 可选，箱体ID
	uuid?: string; // 可选，硬件ID
	name?: string; // 可选，支持模糊查询
	type?: string; // 可选，设备形态：1=拉杆，2=手提
	soc?: string; // 可选，电量筛选
	stat?: string; // 可选，状态：0=待激活，1=已激活
	remarks?: string; // 可选，备注信息
}

// 分页响应数据接口
export interface PageResult<T> {
	currentPage: number; // 当前页码
	total: number; // 总记录数
	list: T[]; // 数据列表
}

// API响应数据接口
export interface ApiResponse<T> {
	code: number; // 响应码
	message: string; // 响应消息
	data: T; // 响应数据
}

// 箱体类型常量
export const BoxType = {
	TROLLEY: 1, // 拉杆箱
	SUITCASE: 2, // 手提箱
} as const;

// 锁状态常量
export const LockStatus = {
	UNLOCKED: 0, // 未锁
	LOCKED: 1, // 已锁
} as const;

// 蓝牙状态常量
export const BluetoothStatus = {
	DISCONNECTED: 0, // 未连接
	CONNECTED: 1, // 已连接
} as const;

// 激活状态常量
export const ActivationStatus = {
	INACTIVE: 0, // 待激活
	ACTIVE: 1, // 已激活
} as const;
