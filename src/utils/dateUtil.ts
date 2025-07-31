/**
 * 格式化日期时间
 * @param dateTimeStr ISO格式的时间字符串
 * @param defaultValue 默认值，当时间无效时返回
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(dateTimeStr: string, defaultValue: string = '-'): string {
	// 检查是否为空或无效的时间
	if (!dateTimeStr) {
		return defaultValue;
	}

	try {
		const date = new Date(dateTimeStr);

		// 检查是否为有效日期
		if (isNaN(date.getTime())) {
			return defaultValue;
		}

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	} catch (error) {
		console.warn('日期格式化失败:', error);
		return defaultValue;
	}
}

/**
 * 格式化日期（不含时间）
 * @param dateStr ISO格式的时间字符串
 * @param defaultValue 默认值，当时间无效时返回
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateStr: string, defaultValue: string = '-'): string {
	// 检查是否为空或无效的时间
	if (!dateStr) {
		return defaultValue;
	}

	try {
		const date = new Date(dateStr);

		// 检查是否为有效日期
		if (isNaN(date.getTime())) {
			return defaultValue;
		}

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	} catch (error) {
		console.warn('日期格式化失败:', error);
		return defaultValue;
	}
}

/**
 * 获取相对时间描述
 * @param dateTimeStr ISO格式的时间字符串
 * @param defaultValue 默认值，当时间无效时返回
 * @returns 相对时间描述
 */
export function getRelativeTime(dateTimeStr: string, defaultValue: string = '-'): string {
	// 检查是否为空或无效的时间
	if (!dateTimeStr) {
		return defaultValue;
	}

	try {
		const date = new Date(dateTimeStr);

		// 检查是否为有效日期
		if (isNaN(date.getTime())) {
			return defaultValue;
		}

		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 30) {
			return formatDate(dateTimeStr);
		} else if (days > 0) {
			return `${days}天前`;
		} else if (hours > 0) {
			return `${hours}小时前`;
		} else if (minutes > 0) {
			return `${minutes}分钟前`;
		} else if (seconds >= 0) {
			return seconds < 30 ? '刚刚' : `${seconds}秒前`;
		} else {
			return formatDateTime(dateTimeStr);
		}
	} catch (error) {
		console.warn('相对时间计算失败:', error);
		return defaultValue;
	}
}
