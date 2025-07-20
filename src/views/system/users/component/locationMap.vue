<template>
	<div class="location-map-container">
		<el-dialog
			:title="dialogTitle"
			v-model="isShowDialog"
			width="1200px"
			:close-on-click-modal="false"
			:close-on-press-escape="true"
			destroy-on-close
		>
			<div class="map-content">
				<div class="map-left">
					<div class="map-placeholder" ref="mapContainer" id="mapContainer">
						<div v-if="loadError" class="map-error">
							<el-empty description="地图加载失败" />
						</div>
						<div v-if="mapLoading" class="map-loading">
							<el-icon class="is-loading"><Loading /></el-icon>
							<span>地图加载中...</span>
						</div>
					</div>
				</div>
				<div class="map-right">
					<!-- 统一的状态和控制区域 -->
					<div class="status-control-area">
						<!-- 加载中状态 -->
						<div v-if="mapLoading" class="map-status">
							<el-alert title="地图加载中..." type="loading" show-icon :closable="false" />
						</div>
						<!-- 加载失败状态 -->
						<div v-else-if="loadError" class="map-status">
							<el-alert title="地图加载失败" type="error" description="可能的原因：网络连接问题 请刷新重试 " show-icon :closable="false" />
						</div>
						<!-- 轨迹模式加载成功 - 显示播放控制 -->
						<div v-else-if="currentMode === 'track' && locationData && !mapLoading" class="track-controls">
							<div class="track-info">
								<el-tag :type="isTrackPlaying ? 'success' : 'info'" size="small">
									{{ isTrackPlaying ? '轨迹播放中' : '轨迹已停止' }}
								</el-tag>
								<span class="track-progress">{{ trackProgress.current }}/{{ trackProgress.total }}</span>
							</div>
							<div class="control-buttons">
								<el-button size="small" @click="pauseTrack" v-if="isTrackPlaying && !trackPaused" type="warning">
									<el-icon><VideoPause /></el-icon>
									暂停
								</el-button>
								<el-button size="small" @click="resumeTrack" v-if="isTrackPlaying && trackPaused" type="primary">
									<el-icon><VideoPlay /></el-icon>
									继续
								</el-button>
								<el-button size="small" @click="stopTrack" v-if="isTrackPlaying" type="danger">
									<el-icon><Close /></el-icon>
									停止
								</el-button>
								<el-button size="small" @click="restartTrack" v-if="!isTrackPlaying" type="success">
									<el-icon><Refresh /></el-icon>
									重新播放
								</el-button>
							</div>
						</div>
						<!-- 定位模式加载成功 - 显示成功状态 -->
						<div v-else-if="currentMode === 'location' && locationData && !mapLoading" class="map-status">
							<el-alert title="地图加载成功" type="success" show-icon :closable="false" />
						</div>
					</div>

					<!-- 底部位置信息 -->
					<div class="location-info">
						<el-descriptions :column="1" border>
							<el-descriptions-item label="箱体编号">
								<div class="content-wrapper">
									<span v-if="!mapLoading">{{ locationData?.boxId || '---' }}</span>
									<div v-else class="loading-placeholder"></div>
									<el-tag v-if="loadError" type="danger" size="small" class="ml-2">数据获取失败</el-tag>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="当前位置" class-name="location-content-cell">
								<div class="content-wrapper">
									<span v-if="!mapLoading">{{ locationData?.address || '---' }}</span>
									<div v-else class="loading-placeholder"></div>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="更新时间">
								<div class="content-wrapper">
									<span v-if="!mapLoading">{{ locationData?.updateTime || '---' }}</span>
									<div v-else class="loading-placeholder"></div>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="经纬度" class-name="coordinate-content-cell">
								<div class="content-wrapper">
									<span v-if="!mapLoading">{{ locationData ? `${locationData.longitude}, ${locationData.latitude}` : '---' }}</span>
									<div v-else class="loading-placeholder"></div>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="移动状态">
								<div class="content-wrapper">
									<el-tag v-if="!mapLoading" :type="loadError ? 'info' : locationData ? 'success' : 'warning'">
										{{ loadError ? '未知' : locationData ? '静止中' : '加载中' }}
									</el-tag>
									<div v-else class="loading-placeholder" style="width: 60px"></div>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="定位方式">
								<div class="content-wrapper">
									<el-tag v-if="!mapLoading" :type="loadError ? 'info' : locationData ? 'primary' : 'warning'">
										{{ loadError ? '未知' : locationData ? 'GPS' : '加载中' }}
									</el-tag>
									<div v-else class="loading-placeholder" style="width: 50px"></div>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="信号强度">
								<div class="content-wrapper">
									<template v-if="!mapLoading">
										<el-rate
											v-if="locationData"
											v-model="signalStrength"
											:max="4"
											disabled
											show-score
											text-color="#ff9900"
											score-template="{value}格"
										/>
										<el-rate v-else :max="4" disabled :model-value="loadError ? 0 : 1" />
									</template>
									<div v-else class="loading-placeholder" style="width: 120px"></div>
								</div>
							</el-descriptions-item>
							<el-descriptions-item label="在线状态">
								<div class="content-wrapper">
									<el-tag v-if="!mapLoading" :type="loadError ? 'danger' : locationData ? 'success' : 'warning'">
										{{ loadError ? '离线' : locationData ? '在线' : '连接中' }}
									</el-tag>
									<div v-else class="loading-placeholder" style="width: 50px"></div>
								</div>
							</el-descriptions-item>
						</el-descriptions>
					</div>
				</div>
			</div>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="closeDialog">关 闭</el-button>
					<el-button type="primary" @click="refreshLocation" :loading="!locationData && !loadError">
						<el-icon><Refresh /></el-icon>
						{{ !locationData && !loadError ? '加载中' : '刷新位置' }}
					</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Loading, VideoPause, VideoPlay, Close, Check } from '@element-plus/icons-vue';

// 声明天地图API的全局类型
declare global {
	interface Window {
		T: any;
		d3: any;
	}
}

// 定义接口
interface LocationData {
	boxId: string;
	address: string;
	updateTime: string;
	longitude: number;
	latitude: number;
}

interface TrackPoint {
	lng: number;
	lat: number;
	time?: string;
}

// 响应式数据
const isShowDialog = ref(false);
const currentMode = ref<'location' | 'track'>('location');
const locationData = ref<LocationData | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const signalStrength = ref(3);
const loadError = ref(false);
const mapLoading = ref(false);

// 轨迹相关响应式数据
const isTrackPlaying = ref(false);
const trackPaused = ref(false);
const trackProgress = ref({ current: 0, total: 0 });

// 计算属性
const dialogTitle = computed(() => {
	return currentMode.value === 'track' ? '箱体轨迹记录' : '箱体定位信息';
});

// 地图相关变量
let map: any = null;
let marker: any = null;
let carTrack: any = null;
const TIANDITU_TOKEN = 'ba2a93cdedaa00e7df2b79ca5f7ecb98';

// 模拟位置数据
const mockLocations = [
	{ address: '北京市朝阳区建国路88号', longitude: 116.4607, latitude: 39.9212 },
	{ address: '上海市浦东新区陆家嘴环路1000号', longitude: 121.5058, latitude: 31.2456 },
	{ address: '广州市天河区珠江新城花城大道85号', longitude: 113.3221, latitude: 23.1291 },
	{ address: '深圳市南山区科技园南区深南大道9988号', longitude: 113.9547, latitude: 22.5463 },
	{ address: '杭州市西湖区文三路269号', longitude: 120.1551, latitude: 30.2741 },
	{ address: '成都市高新区天府大道北段1700号', longitude: 104.0648, latitude: 30.672 },
];

// 获取位置数据
const getLocationData = (boxId: string): Promise<LocationData> => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (Math.random() > 0.9) {
				reject(new Error('获取位置信息失败'));
				return;
			}

			const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
			const locationData = {
				boxId: boxId,
				address: randomLocation.address,
				updateTime: new Date().toLocaleString(),
				longitude: randomLocation.longitude,
				latitude: randomLocation.latitude,
			};

			resolve(locationData);
		}, 1000);
	});
};

// 动态加载天地图API
const loadTiandituAPI = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (window.T && window.T.CarTrack) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://api.tianditu.gov.cn/api?v=4.0&tk=' + TIANDITU_TOKEN;
		script.onload = () => {
			// 初始化轨迹跟踪类
			initCarTrackClasses();
			resolve();
		};
		script.onerror = () => reject(new Error('天地图API加载失败'));
		document.head.appendChild(script);
	});
};

// 初始化车辆轨迹跟踪类
const initCarTrackClasses = () => {
	if (!window.T) return;

	// CarOverlay 类定义
	const CarOverlay = window.T.Overlay.extend({
		initialize: function (lnglat: any, options: any) {
			this.lnglat = lnglat;
			this.setOptions(options);
			this.options = options;
		},

		onAdd: function (map: any) {
			this.map = map;
			const div = (this.div = document.createElement('div'));
			const img = (this.img = document.createElement('img'));
			div.style.position = 'absolute';
			div.style.width = this.options.width + 'px';
			div.style.height = this.options.height + 'px';
			div.style.marginLeft = -this.options.width / 2 + 'px';
			div.style.marginTop = -this.options.height / 2 + 'px';
			div.style.zIndex = '200';
			img.style.width = this.options.width + 'px';
			img.style.height = this.options.height + 'px';
			img.src = this.options.iconUrl;
			div.appendChild(img);
			map.getPanes().overlayPane.appendChild(this.div);
			this.update(this.lnglat);
		},

		onRemove: function () {
			const parent = this.div.parentNode;
			if (parent) {
				parent.removeChild(this.div);
				this.map = null;
				this.div = null;
			}
		},

		CSS_TRANSFORM: function () {
			const div = document.createElement('div');
			const props = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
			for (let i = 0; i < props.length; i++) {
				const prop = props[i];
				if (div.style[prop as any] !== undefined) {
					return prop;
				}
			}
			return props[0];
		},

		setRotate: function (rotate: number) {
			this.img.style[this.CSS_TRANSFORM()] = 'rotate(' + rotate + 'deg)';
		},

		setLnglat: function (lnglat: any) {
			this.lnglat = lnglat;
			this.update();
		},

		getLnglat: function () {
			return this.lnglat;
		},

		update: function () {
			const pos = this.map.lngLatToLayerPoint(this.lnglat);
			this.div.style.left = pos.x + 'px';
			this.div.style.top = pos.y + 'px';
		},
	});

	// CarTrack 类定义
	window.T.CarTrack = function (map: any, opt: any) {
		this.map = map;
		this.options = {
			interval: 1000,
			carstyle: {
				display: true,
				iconUrl:
					'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNDA5RUZGIi8+Cjwvc3ZnPgo=',
				width: 24,
				height: 24,
			},
			polylinestyle: {
				display: true,
				color: '#409EFF',
				width: 3,
				opacity: 0.8,
			},
		};

		// 合并选项
		Object.assign(this.options, opt);
		this.init();
	};

	// CarTrack 原型方法
	window.T.CarTrack.prototype = {
		init: function () {
			this.options.uid = new Date().getTime();
			this.options.Counter = 0;
			this.state = 0;

			if (this.options.Datas && this.options.Datas.length > 0) {
				this.carMarker = new CarOverlay(this.options.Datas[0], this.options.carstyle);
				this.map.addOverLay(this.carMarker);
			}
		},

		start: function () {
			if (this.state === 4) return;
			this.state = 1;
			if (!this._timer) {
				this._timer = setInterval(() => this.update(), this.options.interval);
			}
		},

		pause: function () {
			if (this.state === 4) return;
			this.state = 3;
			if (this._timer) {
				clearInterval(this._timer);
				this._timer = null;
			}
		},

		clear: function () {
			this.state = 4;
			if (this._timer) {
				clearInterval(this._timer);
				this._timer = null;
			}
			if (this.carMarker) {
				this.map.removeOverLay(this.carMarker);
			}
		},

		update: function () {
			if (!this.options.Datas || this.options.Counter >= this.options.Datas.length) {
				// 轨迹播放完成，停止动画
				if (this._timer) {
					clearInterval(this._timer);
					this._timer = null;
				}
				this.state = 2; // 设置为停止状态

				// 通知外部轨迹播放完成
				if (this.options.onTrackComplete) {
					this.options.onTrackComplete();
				}
				return;
			}

			const currentPoint = this.options.Datas[this.options.Counter];
			this.carMarker.setLnglat(currentPoint);

			// 计算旋转角度
			if (this.options.Counter > 0) {
				const prevPoint = this.options.Datas[this.options.Counter - 1];
				const angle = this.calculateAngle(prevPoint, currentPoint);
				this.carMarker.setRotate(angle);
			}

			// 回调函数
			if (this.options.passOneNode) {
				this.options.passOneNode(currentPoint, this.options.Counter + 1, this.options.Datas.length);
			}

			this.options.Counter++;
		},

		calculateAngle: function (prevPoint: any, currentPoint: any) {
			const dx = currentPoint.lng - prevPoint.lng;
			const dy = currentPoint.lat - prevPoint.lat;
			return (Math.atan2(dy, dx) * 180) / Math.PI;
		},
	};
};

// 初始化地图
const initMap = async () => {
	if (!mapContainer.value || !locationData.value) return;

	try {
		await loadTiandituAPI();

		// 清理已存在的地图
		if (map) {
			map.clearOverLays();
			map = null;
		}

		// 创建地图实例并初始化
		map = new window.T.Map('mapContainer');
		const lngLat = new window.T.LngLat(locationData.value.longitude, locationData.value.latitude);
		map.centerAndZoom(lngLat, 15);

		// 只在定位模式下添加标记点
		if (currentMode.value === 'location') {
			updateMapMarker();
		}
	} catch (error: any) {
		console.error('地图初始化失败:', error);
		ElMessage.error('地图初始化失败: ' + (error?.message || error));
		loadError.value = true;
	}
};

// 更新地图标记点
const updateMapMarker = () => {
	if (!map || !locationData.value) return;

	try {
		// 清除之前的标记点
		if (marker) {
			map.removeOverLay(marker);
		}

		// 创建新的标记点
		const lngLat = new window.T.LngLat(locationData.value.longitude, locationData.value.latitude);
		marker = new window.T.Marker(lngLat);

		// 创建信息窗口
		const infoContent = `
			<div style="padding: 12px; min-width: 200px; font-family: Arial, sans-serif;">
				<h4 style="margin: 0 0 10px 0; color: #409EFF; font-size: 16px; font-weight: bold;">
					📦 箱体编号: ${locationData.value.boxId}
				</h4>
				<p style="margin: 6px 0; color: #333; font-size: 14px;">
					📍 地址: ${locationData.value.address}
				</p>
				<p style="margin: 6px 0; color: #666; font-size: 12px;">
					⏰ 更新时间: ${locationData.value.updateTime}
				</p>
				<p style="margin: 6px 0; color: #666; font-size: 12px;">
					🌐 经纬度: ${locationData.value.longitude.toFixed(6)}, ${locationData.value.latitude.toFixed(6)}
				</p>
			</div>
		`;

		const infoWindow = new window.T.InfoWindow(infoContent);

		// 添加点击事件
		marker.addEventListener('click', () => {
			marker.openInfoWindow(infoWindow);
		});

		// 添加到地图并自动显示信息窗口
		map.addOverLay(marker);
		marker.openInfoWindow(infoWindow);
		map.panTo(lngLat);
	} catch (error: any) {
		console.error('标记点更新失败:', error);
	}
};

// 打开弹窗
const openDialog = async (boxId: string, mode: 'location' | 'track' = 'location') => {
	isShowDialog.value = true;
	currentMode.value = mode;
	loadError.value = false;
	locationData.value = null;
	mapLoading.value = true;

	try {
		locationData.value = await getLocationData(boxId);
		await nextTick();
		await initMap();

		// 轨迹模式下自动开始播放
		if (mode === 'track') {
			await nextTick(); // 确保地图完全初始化
			startTrackAnimation();
		}
	} catch (error: any) {
		console.error('获取位置信息失败:', error);
		loadError.value = true;
		ElMessage.error('获取位置信息失败');
	} finally {
		mapLoading.value = false;
	}
};

// 关闭弹窗
const closeDialog = () => {
	// 停止轨迹动画
	if (isTrackPlaying.value) {
		stopTrack();
	}

	isShowDialog.value = false;
	currentMode.value = 'location';
	locationData.value = null;
	mapLoading.value = false;
	loadError.value = false;

	// 重置轨迹状态
	isTrackPlaying.value = false;
	trackPaused.value = false;
	trackProgress.value = { current: 0, total: 0 };

	// 清理地图实例
	if (map) {
		try {
			map.clearOverLays();
		} catch (error) {
			console.warn('清理地图时出现错误:', error);
		}
		map = null;
		marker = null;
		carTrack = null;
	}
};

// 刷新位置信息
const refreshLocation = async () => {
	if (!locationData.value?.boxId) return;

	loadError.value = false;
	try {
		locationData.value = await getLocationData(locationData.value.boxId);
		updateMapMarker();
		ElMessage.success('位置信息已更新');
	} catch (error: any) {
		console.error('刷新位置信息失败:', error);
		loadError.value = true;
		ElMessage.error('刷新位置信息失败');
	}
};

// 功能按钮处理 - 已删除电子围栏和告警记录功能

// 轨迹控制函数
const pauseTrack = () => {
	if (carTrack) {
		carTrack.pause();
		trackPaused.value = true;
	}
};

const resumeTrack = () => {
	if (carTrack) {
		carTrack.start();
		trackPaused.value = false;
	}
};

const stopTrack = () => {
	if (carTrack) {
		carTrack.clear();
		carTrack = null;
	}
	isTrackPlaying.value = false;
	trackPaused.value = false;
	trackProgress.value = { current: 0, total: 0 };

	// 轨迹模式下不显示原始标记点
	if (currentMode.value === 'location' && locationData.value) {
		updateMapMarker();
	}
};

const restartTrack = () => {
	if (locationData.value) {
		startTrackAnimation();
	}
};

// 开始轨迹动画
const startTrackAnimation = () => {
	if (!map || !locationData.value) return;

	// 生成模拟轨迹数据
	const trackData = generateMockTrackData(locationData.value);

	// 清除现有标记点
	if (marker) {
		map.removeOverLay(marker);
	}

	// 初始化轨迹动画
	carTrack = new window.T.CarTrack(map, {
		Datas: trackData,
		interval: 300, // 动画间隔毫秒
		carstyle: {
			display: true,
			iconUrl:
				'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNDA5RUZGIi8+Cjwvc3ZnPgo=',
			width: 24,
			height: 24,
		},
		passOneNode: (lnglat: any, index: number, total: number) => {
			trackProgress.value = { current: index, total: total };
		},
		onTrackComplete: () => {
			// 轨迹播放完成
			isTrackPlaying.value = false;
			trackPaused.value = false;
			ElMessage.success('轨迹播放完成');
		},
	});

	isTrackPlaying.value = true;
	trackPaused.value = false;
	carTrack.start();

	ElMessage.success('轨迹播放开始');
};

// 生成模拟轨迹数据
const generateMockTrackData = (centerPoint: LocationData): any[] => {
	const points: any[] = [];
	const baseLatitude = centerPoint.latitude;
	const baseLongitude = centerPoint.longitude;

	// 生成围绕中心点的轨迹路径
	const totalPoints = 15;
	const radius = 0.005; // 大约500米的轨迹范围

	for (let i = 0; i <= totalPoints; i++) {
		const angle = (i / totalPoints) * 2 * Math.PI;
		const deltaLat = Math.sin(angle) * radius;
		const deltaLng = Math.cos(angle) * radius;

		// 创建 T.LngLat 格式的点
		const point = new window.T.LngLat(baseLongitude + deltaLng, baseLatitude + deltaLat);

		points.push(point);
	}
	console.log(11111111111111111);
	console.log(points);
	return points;
};

// 组件卸载时清理
onUnmounted(() => {
	// 清理轨迹动画
	if (carTrack) {
		carTrack.clear();
		carTrack = null;
	}

	if (map) {
		try {
			map.clearOverLays();
			map.destroy && map.destroy();
		} catch (error) {
			console.warn('地图销毁时出现错误:', error);
		}
		map = null;
		marker = null;
	}
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

				.map-loading {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 10px;
					color: #409eff;

					.el-icon {
						font-size: 32px;
					}

					span {
						font-size: 14px;
						color: #666;
					}
				}
			}
		}

		.map-right {
			flex: 1;
			min-width: 300px;
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			.track-controls {
				height: 100%;
				padding: 18px;
				border: 1px solid #e4e7ed;
				background-color: #f8f9fa;
				border-radius: 8px;

				.track-info {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 24px;

					.track-progress {
						font-size: 13px;
						color: #606266;
						font-weight: 500;
						background: #fff;
						padding: 4px 8px;
						border-radius: 4px;
						border: 1px solid #e4e7ed;
					}
				}

				.control-buttons {
					display: flex;
					gap: 10px;
					justify-content: center;
					flex-wrap: wrap;

					.el-button {
						padding: 16px 24px;
						min-width: 70px;
					}
				}
			}

			.status-control-area {
				height: 120px;
			}

			.map-status {
				text-align: center;
				height: 100%;
				border-radius: 8px;
				padding: 20px;

				.el-alert {
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.el-alert--loading {
					color: rgb(179, 179, 179) !important;
				}
				.status-tag {
					padding: 8px 16px;
					font-size: 14px;
					font-weight: 500;
					display: inline-flex;
					align-items: center;
					gap: 8px;
					border: none;
					border-radius: 20px;

					.el-icon {
						font-size: 16px;
					}
				}
			}

			.location-info {
				flex-shrink: 0;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
				border-top: 2px solid #e4e7ed;
				padding-top: 15px;

				:deep(.el-descriptions) {
					.el-descriptions__table {
						table-layout: fixed;
						width: 100%;
					}

					.el-descriptions__cell {
						padding: 12px;
						vertical-align: top;
						transition: none;
					}

					.el-descriptions__label {
						width: 120px;
						min-width: 120px;
						max-width: 120px;
						word-wrap: break-word;
					}

					.el-descriptions__content {
						width: calc(100% - 120px);
						min-height: 48px;
						line-height: 1.5;
						word-wrap: break-word;
						word-break: break-word;
					}
				}

				.content-wrapper {
					min-height: 28px;
				}

				:deep(.location-content-cell) {
					min-height: 72px !important;
					padding: 12px !important;
					vertical-align: top !important;

					.content-wrapper {
						min-height: 50px;
						line-height: 1.6;
						word-wrap: break-word;
						word-break: break-word;
						white-space: normal;
						display: block;
					}
				}

				:deep(.coordinate-content-cell) {
					min-height: 50px !important;
					padding: 12px !important;
					vertical-align: top !important;

					.content-wrapper {
						line-height: 1.5;
						font-family: 'Courier New', monospace;
						font-size: 13px;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						min-height: 24px;
						display: block;
					}
				}

				// 防止加载时的布局跳动
				.content-wrapper {
					transition: none !important;
				}

				// 骨架屏效果
				.loading-placeholder {
					height: 20px;
					background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
					background-size: 200% 100%;
					animation: loading 1.5s infinite;
					border-radius: 4px;
				}

				@keyframes loading {
					0% {
						background-position: 200% 0;
					}
					100% {
						background-position: -200% 0;
					}
				}

				.error-message {
					margin-top: auto;
					padding: 20px 0;
				}

				.ml-2 {
					margin-left: 8px;
				}

				:deep(.el-tag) {
					min-width: 60px;
					text-align: center;
				}

				:deep(.el-rate) {
					min-width: 120px;
					display: inline-flex;
					height: 24px;
				}
			}
		}
	}
}
</style>
