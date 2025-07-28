import { BoxQueryParams, BoxType, ActivationStatus } from './types';

/**
 * 转换查询参数为后端接口格式
 * @param params 前端查询参数
 * @returns 后端接口参数
 */
export function convertQueryParams(params: BoxQueryParams): Record<string, string | number> {
	const result: Record<string, string | number> = {
		pageNum: params.pageNum,
		pageSize: params.pageSize,
	};

	// 可选参数
	if (params.id) result.id = params.id;
	if (params.uuid) result.uuid = params.uuid;
	if (params.name) result.name = params.name;
	if (params.type !== undefined) result.type = params.type.toString();
	if (params.soc !== undefined) result.soc = params.soc.toString();
	if (params.stat !== undefined) result.stat = params.stat.toString();
	if (params.remarks) result.remarks = params.remarks;

	return result;
}

/**
 * 转换响应数据中的类型
 * @param data 后端响应数据
 * @returns 转换后的数据
 */
export function convertResponseData<T>(data: any): T {
	// 处理日期格式
	if (data.createdAt) {
		data.createdAt = new Date(data.createdAt).toLocaleString();
	}
	if (data.updatedAt) {
		data.updatedAt = new Date(data.updatedAt).toLocaleString();
	}

	// 转换枚举类型
	if (data.type !== undefined) {
		data.type = Number(data.type) as BoxType;
	}
	if (data.stat !== undefined) {
		data.stat = Number(data.stat) as ActivationStatus;
	}

	return data as T;
}
