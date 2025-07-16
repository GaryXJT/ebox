import request from '/@/utils/request';

export function getBoxList(query: Object) {
	return request({
		url: '/api/v1/system/box/list',
		method: 'get',
		params: query,
	});
}

export function addBox(data: object) {
	return request({
		url: '/api/v1/system/box/add',
		method: 'post',
		data: data,
	});
}

export function editBox(data: object) {
	return request({
		url: '/api/v1/system/box/edit',
		method: 'put',
		data: data,
	});
}

export function deleteBox(ids: number[]) {
	return request({
		url: '/api/v1/system/box/delete',
		method: 'delete',
		data: { ids },
	});
}

export function getBoxLocation(boxId: number) {
	return request({
		url: `/api/v1/system/box/${boxId}/location`,
		method: 'get',
	});
}

export function getBoxTrajectory(boxId: number) {
	return request({
		url: `/api/v1/system/box/${boxId}/trajectory`,
		method: 'get',
	});
}

export function activateBox(boxId: number) {
	return request({
		url: `/api/v1/system/box/${boxId}/activate`,
		method: 'post',
	});
}
