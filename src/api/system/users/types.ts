// 用户任务状态枚举
export enum UserTaskStatus {
	IN_TASK = 1, // 任务中
	NO_TASK = 0, // 无任务
}

// 用户信息接口
export interface IUser {
	id: number; // 用户ID
	name: string; // 姓名
	deptName: string; // 部门名称
	gender: string; // 性别
	permissions: string[]; // 权限列表
	taskStatus: UserTaskStatus; // 任务状态
	rfidCard: string; // RFID卡号
	fingerprint: string; // 指纹码
	remarks: string; // 备注
	createdAt: string; // 创建时间
}

// 表格参数接口
export interface TableParam {
	pageNum: number;
	pageSize: number;
	deptId: string;
	gender?: string;
	taskStatus?: UserTaskStatus;
	keyWords: string;
	dateRange: string[];
}

// 表格数据状态接口
export interface TableDataState {
	ids: number[];
	deptProps: {
		id: string;
		children: string;
		label: string;
	};
	tableData: {
		data: IUser[];
		total: number;
		loading: boolean;
		param: TableParam;
	};
}
