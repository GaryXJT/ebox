import request from '/@/utils/request';
import { BoxInfo, BoxQueryParams, PageResult, ApiResponse } from './types';

// 导出所有子模块
export * from './fence';
export * from './userBox';

/**
 * 获取箱体列表
 * @param params 查询参数
 */
export function getBoxList(params: BoxQueryParams) {
	return request<ApiResponse<PageResult<BoxInfo>>>({
		url: '/api/v1/ebox/eboxBoxes/list',
		method: 'get',
		params,
	});
}

/**
 * 添加箱体
 * @param data 箱体信息
 */
export function addBox(data: Omit<BoxInfo, 'id'>) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxBoxes/add',
		method: 'post',
		data,
	});
}

/**
 * 修改箱体信息
 * @param data 箱体信息
 */
export function updateBox(data: Partial<BoxInfo> & { id: number }) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxBoxes/edit',
		method: 'put',
		data,
	});
}

/**
 * 删除箱体
 * @param ids 箱体ID数组
 */
export function deleteBox(ids: number[]) {
	return request<ApiResponse<void>>({
		url: '/api/v1/ebox/eboxBoxes/delete',
		method: 'delete',
		data: { ids },
	});
}

/**
 * 获取箱体轨迹点列表
 * @param params 查询参数
 */
export function getBoxTrackPoints(params: {
	pageNum: number; // 页码
	pageSize: number; // 每页数量
	boxId: number; // 箱体ID
	startTime?: number; // 开始时间戳
	endTime?: number; // 结束时间戳
}) {
	return request<
		ApiResponse<
			PageResult<{
				id: number; // 轨迹点ID
				boxId: number; // 箱体ID
				position: {
					// GeoJSON格式位置信息
					type: 'Point';
					coordinates: [number, number]; // [经度, 纬度]
				};
				time: number; // 记录时间戳
			}>
		>
	>({
		url: '/api/v1/ebox/eboxBoxPoints/list',
		method: 'get',
		params,
	});
}
