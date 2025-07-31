import request from '/@/utils/request';
import { BoxInfo, BoxQueryParams, PageResult, ApiResponse, BoxTrackPoint } from './types';

// 导出所有子模块
export * from './fence';
export * from './userBox';

/**
 * 获取箱体列表
 * @param params 查询参数
 */
// 获取箱体列表
// 获取箱体绑定的用户信息
export interface BoxUserInfo {
	id: number;
	name: string;
	dept: string;
}

// 获取箱体绑定的用户列表
export function getBoxUserList(eboxid: string): Promise<ApiResponse<BoxUserInfo[]>> {
	return request({
		url: '/api/v1/ebox/eboxUserBox/list',
		method: 'get',
		params: { eboxid },
	});
}

// 获取箱子定位
// 获取箱体轨迹点列表
export interface GetBoxTrackPointsParams {
	pageNum: number; // 页码
	pageSize: number; // 每页数量
	boxId: string | number; // 箱体ID
	timestampstart?: string | null; // 开始时间
	timestampend?: string | null; // 结束时间
}

export function getBoxDetail(id: string): Promise<ApiResponse<BoxInfo>> {
	return request({
		url: '/api/v1/ebox/eboxBoxes/get',
		method: 'get',
		params: { id },
	});
}

export function getBoxList(params: BoxQueryParams): Promise<ApiResponse<PageResult<BoxInfo>>> {
	return request({
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
export function getBoxTrackPoints(params: GetBoxTrackPointsParams) {
	return request({
		url: '/api/v1/ebox/eboxBoxPoints/list',
		method: 'get',
		params,
	});
}
