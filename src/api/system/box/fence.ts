import request from '/@/utils/request';
import { ApiResponse, PageResult } from './types';

// 电子围栏信息接口
interface FenceInfo {
	id: number; // 围栏ID
	name: string; // 围栏名称
	type: number; // 围栏类型
	geometry: {
		// GeoJSON格式围栏形状
		type: 'Polygon';
		coordinates: [number, number][][]; // 多边形坐标点数组
	};
	remarks?: string; // 备注
}

// 围栏查询参数接口
interface FenceQueryParams {
	pageNum: number; // 页码
	pageSize: number; // 每页数量
	name?: string; // 围栏名称
	type?: number; // 围栏类型
}

// 围栏-箱体关联信息接口
interface FenceBoxBinding {
	id: number; // 关联关系ID
	fenceId: number; // 围栏ID
	eboxId: number; // 箱体ID
	createdAt: number; // 创建时间
	updatedAt: number; // 更新时间
}

// ==================== 电子围栏基础管理接口 ====================

/**
 * 获取电子围栏列表
 * @param params 查询参数
 */
export function getFenceList(params: FenceQueryParams) {
	return request<ApiResponse<PageResult<FenceInfo>>>({
		url: '/api/v1/ebox/eboxFences/list',
		method: 'get',
		params,
	});
}

/**
 * 添加电子围栏
 * @param data 围栏信息
 */
export function addFence(data: Omit<FenceInfo, 'id'>) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxFences/add',
		method: 'post',
		data,
	});
}

/**
 * 修改电子围栏
 * @param data 围栏信息
 * Body为ADD请求参数body的基础上，增加一个字段：需要编辑的围栏id值
 */
export function updateFence(data: Partial<FenceInfo> & { id: number }) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxFences/edit',
		method: 'put',
		data,
	});
}

/**
 * 删除电子围栏
 * @param ids 围栏ID数组
 */
export function deleteFence(ids: number[]) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxFences/delete',
		method: 'delete',
		data: { ids },
	});
}

// ==================== 围栏-箱体关联管理接口 ====================

/**
 * 获取箱体关联的围栏列表
 * @param eboxId 箱体ID
 */
export function getBoxFences(eboxId: number) {
	return request<ApiResponse<FenceBoxBinding[]>>({
		url: '/api/v1/ebox/eboxFenceBox/get',
		method: 'get',
		params: { eboxid: eboxId },
	});
}

/**
 * 解除围栏-箱体关联
 * @param ids 关联关系ID数组
 * BODY 为要解除关联关系的id的数组：
 * {
 *   "ids": [1,2,3]
 * }
 */
export function unbindFenceBoxes(ids: number[]) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxFenceBox/delete',
		method: 'delete',
		data: { ids },
	});
}

/**
 * 添加围栏-箱体关联
 * @param fenceId 围栏ID
 * @param eboxId 箱体ID
 * BODY:
 * {
 *   "fenceId": 1,
 *   "eboxId": 1
 * }
 */
export function bindFenceBox(fenceId: number, eboxId: number) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxFenceBox/add',
		method: 'post',
		data: { fenceId, eboxId },
	});
}
