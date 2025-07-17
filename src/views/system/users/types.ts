// 箱体规格枚举
export enum BoxSpecification {
	SUITCASE = 'suitcase',
	TROLLEY = 'trolley',
}

// 箱体规格标签映射
export const BoxSpecificationLabel = {
	[BoxSpecification.SUITCASE]: '手提箱',
	[BoxSpecification.TROLLEY]: '拉杆箱',
};

// 任务状态枚举
export enum BoxTaskStatus {
	RUNNING = 'running',
	IDLE = 'idle',
}

// 任务状态标签映射
export const BoxTaskStatusLabel = {
	[BoxTaskStatus.RUNNING]: '任务中',
	[BoxTaskStatus.IDLE]: '无',
};

// 开盖状态枚举
export enum BoxCoverStatus {
	OPEN = 'open',
	CLOSED = 'closed',
}

// 开盖状态标签映射
export const BoxCoverStatusLabel = {
	[BoxCoverStatus.OPEN]: '开',
	[BoxCoverStatus.CLOSED]: '关',
};

// 健康状态枚举
export enum BoxHealthStatus {
	HEALTHY = 'healthy',
	ABNORMAL = 'abnormal',
}

// 健康状态标签映射
export const BoxHealthStatusLabel = {
	[BoxHealthStatus.HEALTHY]: '健康',
	[BoxHealthStatus.ABNORMAL]: '异常',
};

// 电子围栏状态枚举
export enum BoxFenceStatus {
	NORMAL = 'normal',
	WARNING = 'warning',
}

// 电子围栏状态标签映射
export const BoxFenceStatusLabel = {
	[BoxFenceStatus.NORMAL]: '正常',
	[BoxFenceStatus.WARNING]: '警告',
};

// 用户关联箱体接口
export interface UserBox {
	id: number;
	boxId: string;
	specification: BoxSpecification;
	taskStatus: BoxTaskStatus;
	coverStatus: BoxCoverStatus;
	healthStatus: BoxHealthStatus;
	fenceStatus: BoxFenceStatus;
	batteryLevel: number;
}

// 查询参数接口
export interface UserBoxQueryParams {
	boxId: string;
	specification: BoxSpecification | '';
	taskStatus: BoxTaskStatus | '';
	pageNum: number;
	pageSize: number;
}
