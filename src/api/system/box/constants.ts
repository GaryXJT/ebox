/**
 * 错误码常量
 */
export const ErrorCode = {
	SUCCESS: 0, // 成功
	UNKNOWN_ERROR: 1, // 未知错误
	PARAM_ERROR: 1001, // 参数错误
	DATA_NOT_FOUND: 1002, // 数据不存在
	NO_PERMISSION: 1003, // 权限不足
	OPERATION_FAILED: 1004, // 操作失败
	DEVICE_OFFLINE: 2001, // 设备离线
	DEVICE_INACTIVE: 2002, // 设备未激活
	DEVICE_LOCKED: 2003, // 设备已锁定
	INVALID_POSITION: 3001, // 位置数据无效
	INVALID_FENCE: 3002, // 围栏数据无效
} as const;

/**
 * 错误码消息映射
 */
export const ErrorMessage: Record<number, string> = {
	[ErrorCode.SUCCESS]: '操作成功',
	[ErrorCode.UNKNOWN_ERROR]: '未知错误',
	[ErrorCode.PARAM_ERROR]: '参数错误',
	[ErrorCode.DATA_NOT_FOUND]: '数据不存在',
	[ErrorCode.NO_PERMISSION]: '权限不足',
	[ErrorCode.OPERATION_FAILED]: '操作失败',
	[ErrorCode.DEVICE_OFFLINE]: '设备离线',
	[ErrorCode.DEVICE_INACTIVE]: '设备未激活',
	[ErrorCode.DEVICE_LOCKED]: '设备已锁定',
	[ErrorCode.INVALID_POSITION]: '位置数据无效',
	[ErrorCode.INVALID_FENCE]: '围栏数据无效',
};
