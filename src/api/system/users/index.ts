import request from '/@/utils/request';
import { UserInfo, UserQueryParams, CreateUserParams, UpdateUserParams, UserBoxBinding, PageResult, ApiResponse } from './types';

/**
 * 获取用户列表
 * @param params 查询参数
 */
export function getUserList(params: UserQueryParams) {
	return request<ApiResponse<PageResult<UserInfo>>>({
		url: '/api/v1/system/users/list',
		method: 'get',
		params,
	});
}

/**
 * 创建用户
 * @param data 用户信息
 */
export function createUser(data: CreateUserParams) {
	return request<ApiResponse<void>>({
		url: '/api/v1/system/users/add',
		method: 'post',
		data,
	});
}

/**
 * 更新用户信息
 * @param data 用户信息
 */
export function updateUser(data: UpdateUserParams) {
	return request<ApiResponse<void>>({
		url: '/api/v1/system/users/edit',
		method: 'put',
		data,
	});
}

/**
 * 删除用户
 * @param ids 用户ID数组
 */
export function deleteUsers(ids: number[]) {
	return request<ApiResponse<void>>({
		url: '/api/v1/system/users/delete',
		method: 'delete',
		data: { ids },
	});
}

/**
 * 重置用户密码
 * @param userId 用户ID
 */
export function resetUserPassword(userId: number) {
	return request<ApiResponse<void>>({
		url: `/api/v1/system/users/${userId}/password/reset`,
		method: 'put',
	});
}

/**
 * 获取用户绑定的箱体列表
 * @param userId 用户ID
 */
export function getUserBoxBindings(userId: number) {
	return request<ApiResponse<UserBoxBinding[]>>({
		url: `/api/v1/system/users/${userId}/boxes`,
		method: 'get',
	});
}

/**
 * 绑定用户和箱体
 * @param userId 用户ID
 * @param boxId 箱体ID
 */
export function bindUserBox(userId: number, boxId: number) {
	return request<ApiResponse<void>>({
		url: `/api/v1/system/users/${userId}/boxes/${boxId}/bind`,
		method: 'post',
	});
}

/**
 * 解绑用户和箱体
 * @param userId 用户ID
 * @param boxId 箱体ID
 */
export function unbindUserBox(userId: number, boxId: number) {
	return request<ApiResponse<void>>({
		url: `/api/v1/system/users/${userId}/boxes/${boxId}/unbind`,
		method: 'delete',
	});
}
