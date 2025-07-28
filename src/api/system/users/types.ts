// 用户基础信息接口
export interface UserInfo {
	id: number; // 用户ID
	username: string; // 用户名
	name: string; // 姓名
	deptId: number; // 部门ID
	deptName: string; // 部门名称
	email?: string; // 邮箱
	phone?: string; // 手机号
	avatar?: string; // 头像
	status: UserStatus; // 用户状态
	createTime: string; // 创建时间
	updateTime: string; // 更新时间
	lastLoginTime?: string; // 最后登录时间
	remark?: string; // 备注
}

// 用户状态枚举
export enum UserStatus {
	Disabled = 0, // 禁用
	Enabled = 1, // 启用
}

// 用户查询参数接口
export interface UserQueryParams {
	pageNum: number; // 页码
	pageSize: number; // 每页数量
	username?: string; // 用户名
	name?: string; // 姓名
	deptId?: number; // 部门ID
	status?: UserStatus; // 用户状态
	phone?: string; // 手机号
	email?: string; // 邮箱
}

// 创建用户参数接口
export interface CreateUserParams {
	username: string; // 用户名
	password: string; // 密码
	name: string; // 姓名
	deptId: number; // 部门ID
	email?: string; // 邮箱
	phone?: string; // 手机号
	status?: UserStatus; // 用户状态
	remark?: string; // 备注
}

// 更新用户参数接口
export interface UpdateUserParams {
	id: number; // 用户ID
	name?: string; // 姓名
	deptId?: number; // 部门ID
	email?: string; // 邮箱
	phone?: string; // 手机号
	status?: UserStatus; // 用户状态
	remark?: string; // 备注
}

// 用户绑定箱体关系接口
export interface UserBoxBinding {
	userId: number; // 用户ID
	boxId: number; // 箱体ID
	bindTime: string; // 绑定时间
}

// 分页响应数据接口
export interface PageResult<T> {
	total: number; // 总记录数
	currentPage: number; // 当前页码
	list: T[]; // 数据列表
}

// API响应数据接口
export interface ApiResponse<T> {
	code: number;
	message: string;
	data?: T;
}
