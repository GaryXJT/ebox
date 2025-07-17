<template>
	<div class="location-map-container">
		<el-dialog
			title="箱体定位信息"
			v-model="isShowDialog"
			width="1200px"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			destroy-on-close
		>
			<div class="map-content">
				<div class="map-left">
					<!-- 地图容器 -->
					<div class="map-placeholder" ref="mapContainer">
						<!-- 地图将在这里初始化 -->
						<div v-if="loadError" class="map-error">
							<el-empty description="地图加载失败" />
						</div>
					</div>
				</div>
				<div class="map-right">
					<!-- 功能按钮区 -->
					<div class="function-buttons">
						<el-button-group>
							<el-button type="primary" @click="handleTrack" :disabled="loadError">
								<el-icon><ele-MapLocation /></el-icon>
								轨迹回放
							</el-button>
							<el-button type="success" @click="handleFence" :disabled="loadError">
								<el-icon><ele-Position /></el-icon>
								电子围栏
							</el-button>
							<el-button type="warning" @click="handleAlarm" :disabled="loadError">
								<el-icon><ele-Bell /></el-icon>
								告警记录
							</el-button>
						</el-button-group>
					</div>
					<!-- 位置信息区 -->
					<div class="location-info">
						<el-descriptions :column="1" border>
							<el-descriptions-item label="箱体编号">
								<div class="content-wrapper">
									{{ locationData?.boxId || '---' }}
									<el-tag v-if="loadError" type="danger" size="small" class="ml-2">数据获取失败</el-tag>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="当前位置">
								<div class="content-wrapper">{{ locationData?.address || '---' }}</div>
							</el-descriptions-item>
							<el-descriptions-item label="更新时间">
								<div class="content-wrapper">{{ locationData?.updateTime || '---' }}</div>
							</el-descriptions-item>
							<el-descriptions-item label="经纬度">
								<div class="content-wrapper">{{ locationData ? `${locationData.longitude}, ${locationData.latitude}` : '---' }}</div>
							</el-descriptions-item>
							<el-descriptions-item label="移动状态">
								<el-tag :type="loadError ? 'info' : locationData ? 'success' : 'warning'">
									{{ loadError ? '未知' : locationData ? '静止中' : '加载中' }}
								</el-tag>
							</el-descriptions-item>
							<el-descriptions-item label="定位方式">
								<el-tag :type="loadError ? 'info' : locationData ? 'primary' : 'warning'">
									{{ loadError ? '未知' : locationData ? 'GPS' : '加载中' }}
								</el-tag>
							</el-descriptions-item>
							<el-descriptions-item label="信号强度">
								<template v-if="locationData">
									<el-rate v-model="signalStrength" :max="4" disabled show-score text-color="#ff9900" score-template="{value}格" />
								</template>
								<template v-else>
									<el-rate :max="4" disabled :model-value="loadError ? 0 : 1" />
								</template>
							</el-descriptions-item>
							<el-descriptions-item label="在线状态">
								<el-tag :type="loadError ? 'danger' : locationData ? 'success' : 'warning'">
									{{ loadError ? '离线' : locationData ? '在线' : '连接中' }}
								</el-tag>
							</el-descriptions-item>
						</el-descriptions>
						<div v-if="loadError" class="error-message">
							<el-alert title="位置信息获取失败" type="error" description="请检查设备连接状态或稍后重试" show-icon :closable="false" />
						</div>
					</div>
				</div>
			</div>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="closeDialog">关 闭</el-button>
					<el-button type="primary" @click="refreshLocation" :loading="!locationData && !loadError">
						<el-icon><ele-Refresh /></el-icon>
						{{ !locationData && !loadError ? '加载中' : '刷新位置' }}
					</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MapLocation, Position, Bell, Refresh } from '@element-plus/icons-vue';

// 定义接口
interface LocationData {
	boxId: string;
	address: string;
	updateTime: string;
	longitude: number;
	latitude: number;
}

const isShowDialog = ref(false);
const locationData = ref<LocationData | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const signalStrength = ref(3); // 信号强度，1-4格
const loadError = ref(false); // 添加错误状态标记

// 模拟获取位置数据
const getLocationData = (boxId: string) => {
	// 这里模拟异步获取数据
	return new Promise<LocationData>((resolve, reject) => {
		setTimeout(() => {
			// 模拟20%的概率失败
			if (Math.random() > 0.8) {
				reject(new Error('获取位置信息失败'));
				return;
			}
			resolve({
				boxId: boxId,
				address: '北京市朝阳区建国路88号',
				updateTime: new Date().toLocaleString(),
				longitude: 116.46,
				latitude: 39.92,
			});
		}, 1000);
	});
};

// 打开弹窗
const openDialog = async (boxId: string) => {
	isShowDialog.value = true;
	loadError.value = false; // 重置错误状态
	locationData.value = null; // 重置数据
	try {
		locationData.value = await getLocationData(boxId);
		initMap();
	} catch (error) {
		loadError.value = true;
		ElMessage.error('获取位置信息失败');
	}
};

// 关闭弹窗
const closeDialog = () => {
	isShowDialog.value = false;
	locationData.value = null;
};

// 刷新位置信息
const refreshLocation = async () => {
	if (!locationData.value?.boxId) return;
	loadError.value = false; // 重置错误状态
	try {
		locationData.value = await getLocationData(locationData.value.boxId);
		updateMapMarker();
		ElMessage.success('位置信息已更新');
	} catch (error) {
		loadError.value = true;
		ElMessage.error('刷新位置信息失败');
	}
};

// 处理轨迹回放
const handleTrack = () => {
	ElMessage.info('轨迹回放功能开发中...');
};

// 处理电子围栏
const handleFence = () => {
	ElMessage.info('电子围栏功能开发中...');
};

// 处理告警记录
const handleAlarm = () => {
	ElMessage.info('告警记录功能开发中...');
};

// 初始化地图
const initMap = () => {
	if (!mapContainer.value || !locationData.value) return;
	// 这里添加地图初始化代码
	// 例如：使用高德地图、百度地图等SDK
};

// 更新地图标记点
const updateMapMarker = () => {
	if (!locationData.value) return;
	// 这里添加更新地图标记点的代码
};

// 组件卸载时清理地图实例
onUnmounted(() => {
	// 清理地图实例的代码
});

defineExpose({
	openDialog,
});
</script>

<style scoped lang="scss">
.location-map-container {
	.map-content {
		display: flex;
		gap: 20px;
		height: 600px;

		.map-left {
			flex: 2;
			.map-placeholder {
				width: 100%;
				height: 100%;
				background-color: #f5f7fa;
				border-radius: 4px;
				position: relative;

				.map-error {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
				}
			}
		}

		.map-right {
			flex: 1;
			min-width: 300px; // 添加最小宽度
			display: flex;
			flex-direction: column;
			gap: 20px;

			.function-buttons {
				padding: 10px 0;
				border-bottom: 1px solid #eee;
				.el-button-group {
					display: flex;
					.el-button {
						flex: 1;
					}
				}
			}

			.location-info {
				flex: 1;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
				gap: 15px;

				:deep(.el-descriptions__cell) {
					padding: 12px;

					&.el-descriptions__label {
						min-width: 120px; // 标签最小宽度
						width: 120px; // 固定标签宽度
					}

					&.el-descriptions__content {
						min-width: 160px; // 内容最小宽度
					}
				}

				.error-message {
					margin-top: auto;
					padding: 0 10px;
				}

				.ml-2 {
					margin-left: 8px;
				}

				:deep(.el-tag) {
					min-width: 60px; // 标签最小宽度
					text-align: center;
				}

				:deep(.el-rate) {
					min-width: 120px; // 评分组件最小宽度
					display: inline-flex;
					height: 24px; // 固定高度
				}
			}
		}
	}
}
</style>
