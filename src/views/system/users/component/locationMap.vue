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
						<!-- 轨迹模式下的时间选择器和状态显示 -->
						<div v-if="currentMode === 'track'" class="track-header">
							<!-- 加载状态 -->
							<div v-if="mapLoading || loadError" class="map-status">
								<el-alert v-if="mapLoading" title="地图加载中..." type="info" :closable="false" effect="dark" class="loading-alert">
									<template #icon>
										<el-icon class="is-loading"><Loading /></el-icon>
									</template>
								</el-alert>
								<el-alert
									v-if="loadError"
									title="地图加载失败"
									type="error"
									description="可能的原因：网络连接问题 请刷新重试"
									show-icon
									:closable="false"
								/>
							</div>

							<!-- 时间筛选器 -->
							<div v-show="!mapLoading && !loadError" class="time-filter">
								<el-form-item label="开始时间">
									<el-date-picker
										v-model="timeFilter.startTime"
										type="datetime"
										placeholder="选择开始时间"
										format="YYYY-MM-DD HH:mm:ss"
										value-format="YYYY-MM-DD HH:mm:ss"
										style="width: 100%"
										@change="handleTimeChange"
									/>
								</el-form-item>
								<el-form-item label="结束时间">
									<el-date-picker
										v-model="timeFilter.endTime"
										type="datetime"
										placeholder="选择结束时间"
										format="YYYY-MM-DD HH:mm:ss"
										value-format="YYYY-MM-DD HH:mm:ss"
										style="width: 100%"
										@change="handleTimeChange"
									/>
								</el-form-item>
							</div>
						</div>

						<!-- 轨迹模式播放控制 -->
						<div v-if="currentMode === 'track'" class="track-controls">
							<div class="track-info">
								<div class="point-details">
									<div class="point-coordinates">
										<template v-if="!mapLoading && currentPoint">
											<span>经度: {{ currentPoint.lng.toFixed(6) }}</span>
											<span>纬度: {{ currentPoint.lat.toFixed(6) }}</span>
										</template>
										<template v-else>
											<span>经度: ---</span>
											<span>纬度: ---</span>
										</template>
									</div>
									<div class="point-time">
										<template v-if="!mapLoading && currentPoint">
											<span>时间: {{ currentPoint.time || '未知' }}</span>
										</template>
										<template v-else>
											<span>时间: ---</span>
										</template>
									</div>
								</div>
								<div class="track-status">
									<el-tag :type="isTrackPlaying ? 'success' : 'info'" size="small">
										{{ isTrackPlaying ? '轨迹播放中' : '轨迹已停止' }}
									</el-tag>
									<span class="track-progress">当前点: {{ !mapLoading ? `${trackProgress.current + 1}/${trackProgress.total + 1}` : '---' }}</span>
								</div>
							</div>

							<!-- 进度条 -->
							<div class="progress-slider">
								<el-slider
									v-model="trackProgress.current"
									:min="0"
									:max="trackProgress.total"
									:disabled="!trackProgress.total || mapLoading"
									:show-tooltip="true"
									:format-tooltip="formatProgressTooltip"
									@change="handleProgressChange"
								/>
							</div>

							<div class="control-buttons">
								<el-button size="small" @click="startTrack" v-if="!isTrackPlaying" type="primary" :disabled="mapLoading">
									<el-icon><VideoPlay /></el-icon>
									开始播放
								</el-button>
								<el-button size="small" @click="pauseTrack" v-if="isTrackPlaying && !trackPaused" type="warning" :disabled="mapLoading">
									<el-icon><VideoPause /></el-icon>
									暂停
								</el-button>
								<el-button size="small" @click="resumeTrack" v-if="isTrackPlaying && trackPaused" type="primary" :disabled="mapLoading">
									<el-icon><VideoPlay /></el-icon>
									继续
								</el-button>
								<el-button size="small" @click="stopTrack" v-if="isTrackPlaying" type="danger" :disabled="mapLoading">
									<el-icon><Close /></el-icon>
									停止
								</el-button>
								<el-button
									size="small"
									@click="restartTrack"
									v-if="!isTrackPlaying && trackProgress.current > 0"
									type="success"
									:disabled="mapLoading"
								>
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
							<template v-if="currentMode === 'location'">
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
							</template>
							<template v-else>
								<el-descriptions-item label="轨迹长度">
									<div class="content-wrapper">
										<span v-if="!mapLoading && trackLength">{{ trackLength }} 米</span>
										<div v-else class="loading-placeholder"></div>
									</div>
								</el-descriptions-item>
							</template>
							<template v-if="currentMode === 'location'">
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
							</template>
							<template v-else>
								<el-descriptions-item label="轨迹点数">
									<div class="content-wrapper">
										<el-tag v-if="!mapLoading" type="success"> {{ trackProgress.total + 1 }} 个点 </el-tag>
										<div v-else class="loading-placeholder" style="width: 50px"></div>
									</div>
								</el-descriptions-item>
							</template>
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
import { ref, computed, nextTick, onUnmounted, reactive } from 'vue';
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

// 时间筛选相关
const timeFilter = reactive({
	startTime: null as string | null,
	endTime: null as string | null,
});

// 轨迹线相关
const trackLine = ref<any>(null);

// 当前轨迹点信息
const currentPoint = ref<{ lng: number; lat: number; time?: string; address?: string } | null>(null);

// 轨迹起终点信息
const trackBounds = ref<{
	start?: { address?: string };
	end?: { address?: string };
} | null>(null);

// 轨迹总长度（米）
const trackLength = ref<number>(0);

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

		// 轨迹模式下初始化轨迹数据
		if (mode === 'track') {
			await nextTick(); // 确保地图完全初始化
			const trackData = generateMockTrackData(locationData.value);
			trackProgress.value = { current: 0, total: trackData.length - 1 };

			// 绘制轨迹线
			const T = window.T;
			trackLine.value = new T.Polyline(trackData, {
				color: '#409EFF',
				weight: 4,
				opacity: 0.8,
				lineStyle: 'solid',
			});
			map.addOverLay(trackLine.value);

			// 将地图视野调整到轨迹范围
			const bounds = new T.LngLatBounds(trackData[0], trackData[0]);
			trackData.forEach((point: any) => bounds.extend(point));
			map.setViewport(trackData);

			// 计算轨迹总长度
			let totalLength = 0;
			for (let i = 1; i < trackData.length; i++) {
				const prevPoint = trackData[i - 1];
				const currentPoint = trackData[i];
				totalLength += prevPoint.distanceTo(currentPoint);
			}
			trackLength.value = Math.round(totalLength);

			// 获取起终点地址
			trackBounds.value = {
				start: { address: '获取地址中...' },
				end: { address: '获取地址中...' },
			};

			// 异步获取起终点地址
			if (trackData.length > 0) {
				reverseGeocode(trackData[0])
					.then((address) => {
						if (trackBounds.value) {
							trackBounds.value.start = { address };
						}
					})
					.catch(() => {
						if (trackBounds.value) {
							trackBounds.value.start = { address: '地址解析失败' };
						}
					});

				const endPoint = trackData[trackData.length - 1];
				reverseGeocode(endPoint)
					.then((address) => {
						if (trackBounds.value) {
							trackBounds.value.end = { address };
						}
					})
					.catch(() => {
						if (trackBounds.value) {
							trackBounds.value.end = { address: '地址解析失败' };
						}
					});
			}

			// 初始化轨迹动画
			carTrack = new T.CarTrack(map, {
				Datas: trackData,
				interval: 300,
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
					isTrackPlaying.value = false;
					trackPaused.value = false;
					ElMessage.success('轨迹播放完成');
				},
			});

			ElMessage.success(`已加载 ${trackData.length} 个轨迹点`);
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
const startTrack = () => {
	if (carTrack) {
		carTrack.start();
		isTrackPlaying.value = true;
		trackPaused.value = false;
		ElMessage.success('轨迹播放开始');
	} else {
		const trackData = reinitTrackData();
		if (trackData) {
			carTrack?.start();
			isTrackPlaying.value = true;
			trackPaused.value = false;
			ElMessage.success('轨迹播放开始');
		}
	}
};

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

	// 轨迹模式下不显示原始标记点
	if (currentMode.value === 'location' && locationData.value) {
		updateMapMarker();
	}
};

const restartTrack = () => {
	if (locationData.value) {
		const trackData = reinitTrackData();
		if (trackData) {
			carTrack?.start();
			isTrackPlaying.value = true;
			trackPaused.value = false;
			ElMessage.success('轨迹重新播放');
		}
	}
};

// 格式化进度条提示
const formatProgressTooltip = (value: number): string => {
	if (!carTrack?.options.Datas) return `点 ${value + 1}`;
	const point = carTrack.options.Datas[value];
	if (!point) return `点 ${value + 1}`;
	return `点 ${value + 1}\n经度: ${point.lng.toFixed(6)}\n纬度: ${point.lat.toFixed(6)}`;
};

// 逆地理编码 - 将经纬度转换为地址
const reverseGeocode = (lnglat: { lng: number; lat: number }): Promise<string> => {
	return new Promise((resolve, reject) => {
		if (!window.T) {
			reject(new Error('天地图API未加载'));
			return;
		}

		try {
			// 创建地理编码服务
			const geocoder = new window.T.Geocoder();

			// 调用逆地理编码服务
			geocoder.getLocation(new window.T.LngLat(lnglat.lng, lnglat.lat), {
				success: (result: any) => {
					if (result.getStatus() === 0) {
						const address = result.getAddress(); // 结构化地址
						const addressComponent = result.getAddressComponent(); // 地址组成要素

						// 组合完整地址
						const fullAddress = [
							addressComponent.province,
							addressComponent.city,
							addressComponent.district,
							addressComponent.street,
							addressComponent.streetNumber,
						]
							.filter(Boolean)
							.join('');

						resolve(fullAddress || address || '未知位置');
					} else {
						reject(new Error('地址解析失败'));
					}
				},
				error: () => {
					reject(new Error('地址解析服务异常'));
				},
			});
		} catch (error) {
			reject(error);
		}
	});
};

// 处理进度条变化
const handleProgressChange = async (value: number) => {
	if (!carTrack?.options.Datas) return;

	// 暂停当前播放
	if (isTrackPlaying.value) {
		carTrack.pause();
		trackPaused.value = true;
	}

	// 更新位置
	const point = carTrack.options.Datas[value];
	if (point) {
		carTrack.carMarker.setLnglat(point);

		// 计算旋转角度
		if (value > 0) {
			const prevPoint = carTrack.options.Datas[value - 1];
			const angle = carTrack.calculateAngle(prevPoint, point);
			carTrack.carMarker.setRotate(angle);
		}

		// 更新进度和当前点信息
		trackProgress.value.current = value;
		currentPoint.value = {
			lng: point.lng,
			lat: point.lat,
			time: point.time || new Date().toLocaleString(), // 模拟数据时间
			address: '获取地址中...',
		};

		// 将地图中心移动到当前点
		map.panTo(point);

		// 获取地址信息
		try {
			const address = await reverseGeocode(point);
			if (currentPoint.value && currentPoint.value.lng === point.lng && currentPoint.value.lat === point.lat) {
				currentPoint.value.address = address;
			}
		} catch (error) {
			console.warn('获取地址失败:', error);
			if (currentPoint.value && currentPoint.value.lng === point.lng && currentPoint.value.lat === point.lat) {
				currentPoint.value.address = '地址解析失败';
			}
		}
	}
};

// 处理时间筛选变化
const handleTimeChange = () => {
	if (!timeFilter.startTime || !timeFilter.endTime) return;

	// 这里应该调用后端API获取指定时间范围内的轨迹点
	// 目前使用模拟数据，仅更新点数显示
	stopTrack();
	const trackData = reinitTrackData();
	if (trackData) {
		ElMessage.success(`已加载 ${trackData.length} 个轨迹点`);
	}
};

// 重新初始化轨迹数据
const reinitTrackData = () => {
	if (!map || !locationData.value) return;

	const trackData = generateMockTrackData(locationData.value);
	trackProgress.value = { current: 0, total: trackData.length - 1 };

	// 清除现有标记点和轨迹线
	if (marker) {
		map.removeOverLay(marker);
	}
	if (trackLine.value) {
		map.removeOverLay(trackLine.value);
	}
	if (carTrack) {
		carTrack.clear();
	}

	// 绘制轨迹线
	const T = window.T;
	trackLine.value = new T.Polyline(trackData, {
		color: '#409EFF',
		weight: 4,
		opacity: 0.8,
		lineStyle: 'solid',
	});
	map.addOverLay(trackLine.value);

	// 将地图视野调整到轨迹范围
	const bounds = new T.LngLatBounds(trackData[0], trackData[0]);
	trackData.forEach((point: any) => bounds.extend(point));
	map.setViewport(trackData);

	// 初始化轨迹动画
	carTrack = new T.CarTrack(map, {
		Datas: trackData,
		interval: 300,
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
			isTrackPlaying.value = false;
			trackPaused.value = false;
			ElMessage.success('轨迹播放完成');
		},
	});

	return trackData;
};

// 生成模拟轨迹数据
const generateMockTrackData = (centerPoint: LocationData): any[] => {
	const points: any[] = [];
	const baseLatitude = centerPoint.latitude;
	const baseLongitude = centerPoint.longitude;
	const T = window.T;

	// 生成围绕中心点的轨迹路径
	const totalPoints = 15;
	const radius = 0.005; // 大约500米的轨迹范围

	for (let i = 0; i <= totalPoints; i++) {
		const angle = (i / totalPoints) * 2 * Math.PI;
		const deltaLat = Math.sin(angle) * radius;
		const deltaLng = Math.cos(angle) * radius;

		// 直接创建 T.LngLat 对象
		const point = new T.LngLat(baseLongitude + deltaLng, baseLatitude + deltaLat);
		points.push(point);
	}

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

			.track-header {
				margin-bottom: 16px;

				.map-status {
					min-height: 120px; // 与 time-filter 等高
					display: flex;
					align-items: center;
					padding: 16px;
					background-color: #f8f9fa;
					border: 1px solid #e4e7ed;
					border-radius: 4px;

					.loading-alert {
						width: 100%;
						:deep(.el-alert__icon) {
							font-size: 16px;
							top: 50%;
							transform: translateY(-50%);
						}
					}
				}

				.time-filter {
					min-height: 120px; // 固定高度
					padding: 16px;
					background-color: #f8f9fa;
					border: 1px solid #e4e7ed;
					border-radius: 4px;

					:deep(.el-form-item) {
						margin-bottom: 16px;
						display: flex;
						align-items: center;

						&:last-child {
							margin-bottom: 0;
						}

						.el-form-item__label {
							padding: 0 12px 0 0;
							line-height: 32px;
							height: 32px;
							color: #606266;
						}

						.el-form-item__content {
							flex: 1;
							min-width: 0;
						}

						.el-date-editor {
							width: 100%;
						}
					}
				}
			}

			.track-controls {
				display: flex;
				flex-direction: column;
				padding: 18px;
				border: 1px solid #e4e7ed;
				background-color: #f8f9fa;
				border-radius: 8px;
				overflow: hidden;
				display: grid;
				grid-template-rows: 1fr auto auto;

				.track-info {
					.track-status {
						display: flex;
						align-items: center;
						gap: 12px;
						padding: 12px;

						.track-progress {
							font-size: 13px;
							color: #606266;
							font-weight: 500;
						}
					}

					.point-details {
						display: flex;
						flex-direction: column;
						gap: 8px;
						font-size: 12px;
						color: #666;
						padding: 12px;
						border-radius: 4px;
						margin-bottom: 12px;

						.point-address {
							.label {
								color: #303133;
								font-weight: 500;
								margin-right: 4px;
							}
							.value {
								color: #409eff;
								word-break: break-all;
								line-height: 1.4;
							}
						}

						.point-coordinates {
							display: flex;
							gap: 12px;
							font-family: 'Courier New', monospace;
							span {
								white-space: nowrap;
							}
						}

						.point-time {
							color: #909399;
							font-size: 11px;
						}
					}
				}

				.progress-slider {
					padding: 12px;

					:deep(.el-slider) {
						margin: 0 8px;

						.el-slider__button {
							width: 16px;
							height: 16px;
							border: 2px solid #409eff;
						}

						.el-slider__bar {
							background-color: #409eff;
						}

						.el-slider__runway {
							height: 6px;
						}
					}
				}

				.control-buttons {
					display: flex;
					gap: 10px;
					justify-content: center;
					flex-wrap: wrap;
					padding: 12px;

					.el-button {
						padding: 8px 16px;
						min-width: 70px;
					}
				}
			}

			.status-control-area {
				flex: 1;
				min-height: 0;
				display: flex;
				flex-direction: column;
				margin-bottom: 16px;
			}

			.map-status {
				text-align: center;
				padding: 20px;
				background: #fff;
				border-radius: 8px;
				border: 1px solid #e4e7ed;

				.el-alert {
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.el-alert--loading {
					color: rgb(179, 179, 179) !important;
				}
			}

			.location-info {
				flex-shrink: 0;
				flex-shrink: 0;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
				border-top: 2px solid #e4e7ed;
				padding-top: 20px;

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

				.track-time-range {
					color: #606266;
					font-size: 13px;
					font-family: 'Courier New', monospace;
					word-break: break-all;
					line-height: 1.4;
				}

				.track-range {
					.range-item {
						margin-bottom: 8px;
						&:last-child {
							margin-bottom: 0;
						}

						.label {
							color: #303133;
							font-weight: 500;
							margin-right: 4px;
						}

						.value {
							color: #409eff;
							word-break: break-all;
							line-height: 1.4;
						}
					}
				}
			}
		}
	}
}
</style>
