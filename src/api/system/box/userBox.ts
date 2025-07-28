import request from '/@/utils/request';
import { ApiResponse } from './types';

// 用户-箱体关联信息接口
interface UserBoxBinding {
	id: number; // 关联关系ID
	userId: number; // 用户ID
	eboxId: number; // 箱体ID
	createdAt: number; // 创建时间
	updatedAt: number; // 更新时间
}

/**
 * 获取用户关联的箱体列表
 * @param userId 用户ID
 */
export function getUserBoxes(userId: number) {
	return request<ApiResponse<UserBoxBinding[]>>({
		url: '/api/v1/ebox/eboxUserBox/get',
		method: 'get',
		params: { userid: userId },
	});
}

/**
 * 获取箱体关联的用户信息
 * @param eboxId 箱体ID
 */
export function getBoxUser(eboxId: number) {
	return request<ApiResponse<UserBoxBinding>>({
		url: '/api/v1/ebox/eboxUserBox/get',
		method: 'get',
		params: { eboxid: eboxId },
	});
}

/**
 * 解除用户-箱体关联
 * @param ids 关联关系ID数组
 * BODY 为 要解除关联关系的id的数组：
 * {
 * "ids":[1,2,3]
 * }
 */
export function unbindUserBoxes(ids: number[]) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxUserBox/delete',
		method: 'delete',
		data: { ids },
	});
}

/**
 * 添加用户-箱体关联
 * @param userId 用户ID
 * @param eboxId 箱体ID
 * BODY:
 * {
 * "userId":1,
 * "eboxId":1,
 * }
 */
export function bindUserBox(userId: number, eboxId: number) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxUserBox/add',
		method: 'post',
		data: { userId, eboxId },
	});
}
