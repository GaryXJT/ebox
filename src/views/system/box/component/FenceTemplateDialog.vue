<template>
	<el-dialog
		:model-value="visible"
		@update:model-value="$emit('update:visible', $event)"
		title="电子围栏模板管理"
		width="1200px"
		:close-on-click-modal="false"
		destroy-on-close
	>
		<div class="fence-template-container">
			<div class="map-content">
				<div class="map-left">
					<div class="map-placeholder" ref="mapContainer" id="fenceTemplateMapContainer">
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
					<!-- 当前围栏信息区域 -->
					<div class="drawing-info" v-if="currentDrawing.coordinates.length > 0">
						<h4 class="section-title">
							<el-icon><LocationFilled /></el-icon>
							当前围栏信息
						</h4>
						<el-form :model="currentDrawing" label-width="80px" size="small">
							<el-form-item label="围栏类型">
								<el-tag :type="getTypeColor(currentDrawing.type)">
									{{ getTypeName(currentDrawing.type) }}
								</el-tag>
							</el-form-item>
							<el-form-item label="坐标点数">
								<span>{{ currentDrawing.coordinates.length }} 个点</span>
							</el-form-item>
							<el-form-item label="围栏面积" v-if="currentDrawing.area">
								<span>{{ currentDrawing.area }} 平方米</span>
							</el-form-item>
							<el-form-item label="围栏周长" v-if="currentDrawing.perimeter">
								<span>{{ currentDrawing.perimeter }} 米</span>
							</el-form-item>
						</el-form>
						<div class="drawing-actions">
							<el-button size="small" @click="clearCurrentDrawing">
								<el-icon><Delete /></el-icon>
								清除围栏
							</el-button>
							<el-button type="primary" size="small" @click="showSaveDialog">
								<el-icon><DocumentAdd /></el-icon>
								保存模板
							</el-button>
						</div>
					</div>

					<!-- 绘图说明 -->
					<div class="drawing-tips" v-else>
						<h4 class="section-title">
							<el-icon><Edit /></el-icon>
							绘图说明
						</h4>
						<div class="tips-content">
							<p><strong>操作说明：</strong></p>
							<ul>
								<li><strong>折线围栏：</strong>点击地图添加点，双击完成绘制</li>
								<li><strong>多边形围栏：</strong>点击地图添加顶点，双击闭合多边形</li>
								<li><strong>圆形围栏：</strong>点击设置圆心，再点击设置半径</li>
								<li><strong>矩形围栏：</strong>点击设置起始点，再点击设置对角点</li>
								<li><strong>取消绘制：</strong>右键或按ESC键取消当前绘制</li>
							</ul>
							<el-alert title="请在地图上选择绘图工具开始绘制围栏" type="info" :closable="false" />
						</div>
					</div>

					<!-- 已保存模板列表 -->
					<div class="template-list">
						<h4 class="section-title">
							<el-icon><FolderOpened /></el-icon>
							围栏模板
							<span class="template-count">({{ savedTemplates.length }})</span>
						</h4>
						<div class="template-items" v-if="savedTemplates.length > 0">
							<div v-for="template in savedTemplates" :key="template.id" class="template-item" @click="loadTemplate(template)">
								<div class="template-header">
									<span class="template-name">{{ template.name }}</span>
									<el-tag size="small" :type="getTypeColor(template.type)">
										{{ getTypeName(template.type) }}
									</el-tag>
								</div>
								<div class="template-meta">
									<span class="template-time">{{ template.createTime }}</span>
									<el-button type="danger" link size="small" @click.stop="deleteTemplate(template.id)">
										<el-icon><Delete /></el-icon>
									</el-button>
								</div>
							</div>
						</div>
						<el-empty v-else description="暂无保存的模板" :image-size="60" />
					</div>
				</div>
			</div>
		</div>

		<!-- 保存模板对话框 -->
		<el-dialog
			:model-value="saveDialog.visible"
			@update:model-value="saveDialog.visible = $event"
			title="保存围栏模板"
			width="450px"
			:close-on-click-modal="false"
		>
			<el-form :model="saveDialog" label-width="100px" :rules="saveRules" ref="saveFormRef">
				<el-form-item label="模板名称：" prop="name">
					<el-input v-model="saveDialog.name" placeholder="请输入模板名称" maxlength="50" show-word-limit clearable />
				</el-form-item>
				<el-form-item label="模板类型：">
					<el-tag :type="getTypeColor(saveDialog.type)">
						{{ getTypeName(saveDialog.type) }}
					</el-tag>
				</el-form-item>
				<el-form-item label="模板描述：">
					<el-input v-model="saveDialog.description" type="textarea" :rows="3" placeholder="请输入模板描述（可选）" maxlength="200" show-word-limit />
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelSave">取消</el-button>
					<el-button type="primary" @click="confirmSave">保存</el-button>
				</div>
			</template>
		</el-dialog>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, LocationFilled, Edit, FolderOpened, DocumentAdd, Delete } from '@element-plus/icons-vue';

// 组件属性
interface Props {
	visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible']);

// 响应式数据
const mapContainer = ref<HTMLElement>();
const saveFormRef = ref();
const mapLoading = ref(true);
const loadError = ref(false);
let map: any = null;
let currentTool: any = null;

// 绘图数据
const currentDrawing = reactive({
	type: '',
	coordinates: [] as any[],
	area: 0,
	perimeter: 0,
	overlay: null as any,
});

// 保存对话框
const saveDialog = reactive({
	visible: false,
	name: '',
	type: '',
	description: '',
	coordinates: [] as any[],
});

// 已保存的模板
const savedTemplates = ref<any[]>([
	{
		id: '1',
		name: '办公区域围栏',
		type: 'polygon',
		coordinates: [],
		createTime: '2024-01-15 10:30:00',
		description: '办公楼周边区域',
	},
	{
		id: '2',
		name: '停车场围栏',
		type: 'rectangle',
		coordinates: [],
		createTime: '2024-01-14 16:20:00',
		description: '员工停车区域',
	},
]);

// 表单验证规则
const saveRules = {
	name: [
		{ required: true, message: '请输入模板名称', trigger: 'blur' },
		{ min: 2, max: 50, message: '名称长度在2到50个字符', trigger: 'blur' },
	],
};

// 计算属性方法
const getTypeName = (type: string) => {
	const typeMap = {
		polyline: '折线围栏',
		polygon: '多边形围栏',
		circle: '圆形围栏',
		rectangle: '矩形围栏',
	};
	return typeMap[type as keyof typeof typeMap] || '未知类型';
};

const getTypeColor = (type: string) => {
	const colorMap = {
		polyline: 'primary',
		polygon: 'success',
		circle: 'warning',
		rectangle: 'danger',
	};
	return colorMap[type as keyof typeof colorMap] || '';
};

// 自定义点击模式状态
const customDrawMode = ref<string>('');
const firstClickPoint = ref<any>(null);
const previewOverlay = ref<any>(null);

// 监听对话框显示状态
watch(
	() => props.visible,
	async (newVal, oldVal) => {
		if (newVal) {
			// 对话框打开时
			await nextTick();
			initMap();
		} else if (oldVal && !newVal) {
			// 对话框关闭时清理
			console.log('对话框关闭，清理资源');

			// 清理自定义绘制模式
			clearCustomDrawMode();

			// 清理当前工具
			if (currentTool) {
				try {
					currentTool.close();
				} catch (error) {
					console.warn('关闭绘图工具时出现错误:', error);
				}
				currentTool = null;
			}

			// 清理地图实例
			if (map) {
				try {
					map.clearOverLays();
				} catch (error) {
					console.warn('清理地图覆盖物时出现错误:', error);
				}
				map = null;
			}

			// 重置状态
			mapLoading.value = false;
			loadError.value = false;
			Object.assign(currentDrawing, {
				type: '',
				coordinates: [],
				area: 0,
				perimeter: 0,
				overlay: null,
			});
		}
	}
);

// 初始化地图
const initMap = async () => {
	if (!mapContainer.value) {
		console.error('地图容器未找到');
		return;
	}

	mapLoading.value = true;
	loadError.value = false;

	try {
		console.log('开始初始化地图...');

		// 动态加载天地图API
		await loadTianDiTuAPI();

		// 等待一下确保DOM准备好
		await nextTick();

		// 确保容器存在
		if (!mapContainer.value) {
			throw new Error('地图容器未准备就绪');
		}

		console.log('创建地图实例...');
		// 创建地图实例，使用唯一的容器ID
		map = new (window as any).T.Map('fenceTemplateMapContainer');
		map.centerAndZoom(new (window as any).T.LngLat(116.403874, 39.915661), 12);

		// 添加控件
		map.addControl(new (window as any).T.Control.Zoom());
		map.addControl(new (window as any).T.Control.Scale());

		// 创建绘图工具控件
		createDrawingTools();

		// 设置默认鼠标样式
		if (mapContainer.value) {
			mapContainer.value.style.cursor = 'default';
		}

		mapLoading.value = false;
		console.log('地图初始化成功');
		ElMessage.success('地图加载成功');
	} catch (error) {
		console.error('地图初始化失败:', error);
		loadError.value = true;
		mapLoading.value = false;
		ElMessage.error('地图加载失败: ' + (error as Error).message);
	}
};

// 动态加载天地图API
const loadTianDiTuAPI = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		// 检查是否已经加载了天地图API
		if ((window as any).T && (window as any).T.Map) {
			console.log('天地图API已加载，直接使用');
			resolve();
			return;
		}

		// 检查是否已经存在加载中的脚本
		const existingScript = document.querySelector('script[src*="api.tianditu.gov.cn"]');
		if (existingScript) {
			console.log('天地图API正在加载中，等待加载完成');
			// 等待已存在的脚本加载完成
			existingScript.addEventListener('load', () => {
				if ((window as any).T && (window as any).T.Map) {
					resolve();
				} else {
					reject(new Error('天地图API加载失败'));
				}
			});
			existingScript.addEventListener('error', () => {
				reject(new Error('天地图API加载失败'));
			});
			return;
		}

		console.log('开始加载天地图API');
		const script = document.createElement('script');
		script.src = 'https://api.tianditu.gov.cn/api?v=4.0&tk=ba2a93cdedaa00e7df2b79ca5f7ecb98';
		script.onload = () => {
			console.log('天地图API加载成功');
			// 等待一小段时间确保API完全初始化
			setTimeout(() => {
				if ((window as any).T && (window as any).T.Map) {
					resolve();
				} else {
					reject(new Error('天地图API初始化失败'));
				}
			}, 100);
		};
		script.onerror = () => {
			console.error('天地图API加载失败');
			reject(new Error('天地图API加载失败'));
		};
		document.head.appendChild(script);
	});
};

// 创建绘图工具控件
const createDrawingTools = () => {
	// 创建自定义控件容器
	const toolContainer = document.createElement('div');
	toolContainer.className = 'drawing-tools-container';
	toolContainer.style.cssText = `
		position: absolute;
		top: 10px;
		left: 10px;
		background: white;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		padding: 8px;
		z-index: 1000;
		display: flex;
		gap: 4px;
	`;

	// 创建工具按钮
	const tools = [
		{ type: 'polyline', title: '折线围栏', icon: '📏' },
		{ type: 'polygon', title: '多边形围栏', icon: '🔶' },
		{ type: 'circle', title: '圆形围栏', icon: '⭕' },
		{ type: 'rectangle', title: '矩形围栏', icon: '⬛' },
		{ type: 'clear', title: '清除', icon: '🗑️' },
	];

	tools.forEach((tool) => {
		const button = document.createElement('button');
		button.innerHTML = `${tool.icon}`;
		button.title = tool.title;
		button.style.cssText = `
			width: 36px;
			height: 36px;
			border: 1px solid #d9d9d9;
			background: white;
			border-radius: 4px;
			cursor: pointer;
			font-size: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
		`;

		button.addEventListener('mouseenter', () => {
			button.style.borderColor = '#409eff';
			button.style.backgroundColor = '#f0f9ff';
		});

		button.addEventListener('mouseleave', () => {
			if (!button.classList.contains('active')) {
				button.style.borderColor = '#d9d9d9';
				button.style.backgroundColor = 'white';
			}
		});

		button.addEventListener('click', (e) => {
			// 防止事件冒泡到地图
			e.preventDefault();
			e.stopPropagation();

			if (tool.type === 'clear') {
				clearAllDrawings();
			} else {
				activateDrawingTool(tool.type, button);
			}
		});

		toolContainer.appendChild(button);
	});

	// 将工具栏添加到地图容器
	mapContainer.value?.appendChild(toolContainer);

	// 防止工具栏容器的点击事件冒泡到地图
	toolContainer.addEventListener('click', (e) => {
		e.stopPropagation();
	});
};

// 激活绘制工具
const activateDrawingTool = (type: string, button: HTMLElement) => {
	try {
		// 清除当前工具
		if (currentTool) {
			currentTool.close();
			currentTool = null;
		}

		// 清除自定义绘制模式
		clearCustomDrawMode();

		// 重置所有按钮样式
		const allButtons = button.parentElement?.querySelectorAll('button');
		allButtons?.forEach((btn) => {
			btn.classList.remove('active');
			btn.style.borderColor = '#d9d9d9';
			btn.style.backgroundColor = 'white';
		});

		// 设置当前按钮为激活状态
		button.classList.add('active');
		button.style.borderColor = '#409eff';
		button.style.backgroundColor = '#f0f9ff';

		const T = (window as any).T;

		// 根据类型创建对应工具
		switch (type) {
			case 'polyline':
				currentTool = new T.PolylineTool(map, {
					color: '#1890ff',
					weight: 2,
					opacity: 0.8,
				});
				currentTool.addEventListener('draw', (e: any) => {
					handlePolylineDrawComplete(e);
				});
				// 设置十字形鼠标
				if (mapContainer.value) {
					mapContainer.value.style.cursor = 'crosshair';
				}
				break;
			case 'polygon':
				currentTool = new T.PolygonTool(map, {
					fillColor: '#52c41a',
					fillOpacity: 0.3,
					color: '#52c41a',
					weight: 2,
					opacity: 0.8,
				});
				currentTool.addEventListener('draw', (e: any) => {
					handlePolygonDrawComplete(e);
				});
				// 设置十字形鼠标
				if (mapContainer.value) {
					mapContainer.value.style.cursor = 'crosshair';
				}
				break;
			case 'circle':
				// 使用自定义点击模式
				customDrawMode.value = 'circle';
				setupCustomCircleDrawing();
				ElMessage.info('请在地图上点击选择圆心位置');
				return;
			case 'rectangle':
				// 使用自定义点击模式
				customDrawMode.value = 'rectangle';
				setupCustomRectangleDrawing();
				ElMessage.info('请在地图上点击选择矩形起始点');
				return;
		}

		if (currentTool) {
			// 开启绘制模式
			currentTool.open();

			// 设置提示信息
			if (currentTool.setTips) {
				const tips = {
					polyline: '点击地图添加点，双击完成绘制',
					polygon: '点击地图添加顶点，双击闭合多边形',
				};
				currentTool.setTips(tips[type as keyof typeof tips] || '开始绘制');
			}

			ElMessage.success(`已激活${getTypeName(type)}绘制模式`);
		}
	} catch (error) {
		console.error('创建绘图工具失败:', error);
		ElMessage.error('绘图工具创建失败');
	}
};

// 处理折线绘制完成
const handlePolylineDrawComplete = (e: any) => {
	try {
		const coordinates = e.currentLnglats || [];
		const distance = e.currentDistance || 0;
		const overlay = e.currentPolyline;

		// 更新当前绘制信息
		Object.assign(currentDrawing, {
			type: 'polyline',
			coordinates,
			area: 0,
			perimeter: Math.round(distance),
			overlay,
		});

		finishDrawing('polyline');
	} catch (error) {
		console.error('处理折线绘制完成失败:', error);
		ElMessage.error('折线绘制处理失败');
	}
};

// 处理多边形绘制完成
const handlePolygonDrawComplete = (e: any) => {
	try {
		const coordinates = e.currentLnglats || [];
		const overlay = e.currentPolygon;

		// 计算面积和周长
		let area = 0;
		let perimeter = 0;

		if (coordinates.length >= 3) {
			area = calculatePolygonArea(coordinates);
			perimeter = calculatePolygonPerimeter(coordinates);
		}

		// 更新当前绘制信息
		Object.assign(currentDrawing, {
			type: 'polygon',
			coordinates,
			area: Math.round(area),
			perimeter: Math.round(perimeter),
			overlay,
		});

		finishDrawing('polygon');
	} catch (error) {
		console.error('处理多边形绘制完成失败:', error);
		ElMessage.error('多边形绘制处理失败');
	}
};

// 处理圆形绘制完成
const handleCircleDrawComplete = (e: any) => {
	try {
		const center = e.currentCenter;
		const radius = e.currentRadius;
		const overlay = e.currentCircle;

		// 根据官方文档，currentCenter是地理坐标，currentRadius是以米为单位的半径
		const coordinates = [{ lng: center.lng, lat: center.lat, radius }];
		const area = Math.PI * radius * radius;
		const perimeter = 2 * Math.PI * radius;

		// 更新当前绘制信息
		Object.assign(currentDrawing, {
			type: 'circle',
			coordinates,
			area: Math.round(area),
			perimeter: Math.round(perimeter),
			overlay,
		});

		finishDrawing('circle');
	} catch (error) {
		console.error('处理圆形绘制完成失败:', error);
		ElMessage.error('圆形绘制处理失败');
	}
};

// 处理矩形绘制完成
const handleRectangleDrawComplete = (e: any) => {
	try {
		const bounds = e.currentBounds;
		const overlay = e.currentRectangle;

		// 根据官方文档，currentBounds是用户拉框选择的地理范围
		const southWest = bounds.getSouthWest();
		const northEast = bounds.getNorthEast();
		const coordinates = [
			{ lng: southWest.lng, lat: southWest.lat },
			{ lng: northEast.lng, lat: northEast.lat },
		];

		// 计算矩形面积和周长
		const width = calculateDistance(southWest, { lng: northEast.lng, lat: southWest.lat });
		const height = calculateDistance(southWest, { lng: southWest.lng, lat: northEast.lat });
		const area = width * height;
		const perimeter = 2 * (width + height);

		// 更新当前绘制信息
		Object.assign(currentDrawing, {
			type: 'rectangle',
			coordinates,
			area: Math.round(area),
			perimeter: Math.round(perimeter),
			overlay,
		});

		finishDrawing('rectangle');
	} catch (error) {
		console.error('处理矩形绘制完成失败:', error);
		ElMessage.error('矩形绘制处理失败');
	}
};

// 完成绘制的通用处理
const finishDrawing = (type: string) => {
	// 恢复默认鼠标样式
	if (mapContainer.value) {
		mapContainer.value.style.cursor = 'default';
	}

	// 关闭绘图工具
	deactivateCurrentTool();

	// 重置工具栏状态
	document.querySelectorAll('.drawing-tools-container button').forEach((btn) => {
		btn.classList.remove('active');
		(btn as HTMLElement).style.borderColor = '#d9d9d9';
		(btn as HTMLElement).style.backgroundColor = 'white';
	});

	ElMessage.success(`${getTypeName(type)}绘制完成`);
};

// 取消当前工具
const deactivateCurrentTool = () => {
	// 恢复默认鼠标样式
	if (mapContainer.value) {
		mapContainer.value.style.cursor = 'default';
	}

	if (currentTool) {
		try {
			currentTool.close();
			currentTool = null;
		} catch (error) {
			console.error('关闭绘图工具失败:', error);
		}
	}
};

// 处理绘制完成（废弃的旧方法，保留以防兼容性问题）
const handleDrawComplete = (type: string, overlay: any) => {
	// 这个方法已被上面的具体处理方法替代
	console.warn('使用了废弃的handleDrawComplete方法');
};

// 计算两点之间的距离（米）
const calculateDistance = (point1: any, point2: any): number => {
	const R = 6371000; // 地球半径（米）
	const lat1 = (point1.lat * Math.PI) / 180;
	const lat2 = (point2.lat * Math.PI) / 180;
	const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
	const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

	const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
};

// 计算折线长度（简化计算，实际应使用地理距离计算）
const calculatePolylineLength = (coordinates: any[]): number => {
	let length = 0;
	for (let i = 1; i < coordinates.length; i++) {
		const dx = coordinates[i].lng - coordinates[i - 1].lng;
		const dy = coordinates[i].lat - coordinates[i - 1].lat;
		length += Math.sqrt(dx * dx + dy * dy) * 111000; // 粗略转换为米
	}
	return length;
};

// 计算多边形面积（简化计算）
const calculatePolygonArea = (coordinates: any[]): number => {
	if (coordinates.length < 3) return 0;

	let area = 0;
	const n = coordinates.length;

	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		area += coordinates[i].lng * coordinates[j].lat;
		area -= coordinates[j].lng * coordinates[i].lat;
	}

	return Math.abs(area * 0.5) * 12100000000; // 粗略转换为平方米
};

// 计算多边形周长
const calculatePolygonPerimeter = (coordinates: any[]): number => {
	if (coordinates.length < 2) return 0;

	let perimeter = 0;
	for (let i = 1; i < coordinates.length; i++) {
		const dx = coordinates[i].lng - coordinates[i - 1].lng;
		const dy = coordinates[i].lat - coordinates[i - 1].lat;
		perimeter += Math.sqrt(dx * dx + dy * dy) * 111000;
	}

	// 闭合多边形，连接最后一点和第一点
	if (coordinates.length > 2) {
		const dx = coordinates[0].lng - coordinates[coordinates.length - 1].lng;
		const dy = coordinates[0].lat - coordinates[coordinates.length - 1].lat;
		perimeter += Math.sqrt(dx * dx + dy * dy) * 111000;
	}

	return perimeter;
};

// 清除所有绘制
const clearAllDrawings = () => {
	// 清除当前绘制的内容
	clearCurrentDrawing();

	// 关闭当前工具
	if (currentTool) {
		currentTool.close();
		currentTool = null;
	}

	// 清除自定义绘制模式
	clearCustomDrawMode();

	// 重置工具按钮状态
	document.querySelectorAll('.drawing-tools-container button').forEach((btn) => {
		btn.classList.remove('active');
		(btn as HTMLElement).style.borderColor = '#d9d9d9';
		(btn as HTMLElement).style.backgroundColor = 'white';
	});

	ElMessage.success('已清除所有绘制内容');
};

// 清除当前绘制
const clearCurrentDrawing = () => {
	if (currentDrawing.overlay) {
		// 从地图移除覆盖物
		map.removeOverLay(currentDrawing.overlay);
	}

	// 重置绘制信息
	Object.assign(currentDrawing, {
		type: '',
		coordinates: [],
		area: 0,
		perimeter: 0,
		overlay: null,
	});
};

// 显示保存对话框
const showSaveDialog = () => {
	if (currentDrawing.coordinates.length === 0) {
		ElMessage.warning('请先绘制围栏');
		return;
	}

	Object.assign(saveDialog, {
		visible: true,
		name: '',
		type: currentDrawing.type,
		description: '',
		coordinates: [...currentDrawing.coordinates],
	});
};

// 确认保存
const confirmSave = async () => {
	try {
		await saveFormRef.value?.validate();

		const newTemplate = {
			id: Date.now().toString(),
			name: saveDialog.name,
			type: saveDialog.type,
			coordinates: saveDialog.coordinates,
			createTime: new Date().toLocaleString(),
			description: saveDialog.description,
		};

		savedTemplates.value.unshift(newTemplate);

		ElMessage.success('模板保存成功');
		cancelSave();
		clearCurrentDrawing();
	} catch (error) {
		console.error('保存失败:', error);
	}
};

// 取消保存
const cancelSave = () => {
	saveDialog.visible = false;
	Object.assign(saveDialog, {
		name: '',
		type: '',
		description: '',
		coordinates: [],
	});
};

// 加载模板
const loadTemplate = (template: any) => {
	ElMessage.info(`加载模板: ${template.name}`);
	// 这里可以实现模板加载到地图的逻辑
};

// 删除模板
const deleteTemplate = async (id: string) => {
	try {
		await ElMessageBox.confirm('确定要删除此模板吗？', '删除确认', {
			type: 'warning',
		});

		const index = savedTemplates.value.findIndex((t) => t.id === id);
		if (index > -1) {
			savedTemplates.value.splice(index, 1);
			ElMessage.success('模板删除成功');
		}
	} catch (error) {
		// 用户取消删除
	}
};

// 组件卸载时清理
onMounted(() => {
	// 组件初始化逻辑
});

// 组件卸载清理
onUnmounted(() => {
	console.log('清理围栏模板对话框组件');

	// 清理自定义绘制模式
	clearCustomDrawMode();

	// 清理当前工具
	if (currentTool) {
		try {
			currentTool.close();
		} catch (error) {
			console.warn('关闭绘图工具时出现错误:', error);
		}
		currentTool = null;
	}

	// 清理地图实例
	if (map) {
		try {
			map.clearOverLays();
			map.destroy && map.destroy();
		} catch (error) {
			console.warn('清理地图时出现错误:', error);
		}
		map = null;
	}
});

// 设置自定义圆形绘制
const setupCustomCircleDrawing = () => {
	// 设置地图容器鼠标样式为十字形
	if (mapContainer.value) {
		mapContainer.value.style.cursor = 'crosshair';
	}

	// 延迟添加事件监听器，避免按钮点击立即触发
	setTimeout(() => {
		map.addEventListener('click', handleCustomCircleClick);
		map.addEventListener('mousemove', handleCustomCircleMouseMove);
		// 添加右键取消功能
		map.addEventListener('rightclick', cancelCustomDrawing);
		// 添加ESC键取消功能
		document.addEventListener('keydown', handleEscapeKey);
	}, 100);
};

// 设置自定义矩形绘制
const setupCustomRectangleDrawing = () => {
	// 设置地图容器鼠标样式为十字形
	if (mapContainer.value) {
		mapContainer.value.style.cursor = 'crosshair';
	}

	// 延迟添加事件监听器，避免按钮点击立即触发
	setTimeout(() => {
		map.addEventListener('click', handleCustomRectangleClick);
		map.addEventListener('mousemove', handleCustomRectangleMouseMove);
		// 添加右键取消功能
		map.addEventListener('rightclick', cancelCustomDrawing);
		// 添加ESC键取消功能
		document.addEventListener('keydown', handleEscapeKey);
	}, 100);
};

// 处理ESC键取消
const handleEscapeKey = (e: KeyboardEvent) => {
	if (e.key === 'Escape') {
		cancelCustomDrawing();
	}
};

// 处理自定义圆形点击
const handleCustomCircleClick = (e: any) => {
	// 防止事件冒泡
	e.preventDefault?.();
	e.stopPropagation?.();

	const T = (window as any).T;

	if (!firstClickPoint.value) {
		// 第一次点击，设置圆心
		firstClickPoint.value = e.lnglat;
		ElMessage.info('已设置圆心，请移动鼠标并点击设置半径');
	} else {
		// 第二次点击，完成圆形绘制
		const center = firstClickPoint.value;
		// 使用天地图API计算距离
		const radius = center.distanceTo ? center.distanceTo(e.lnglat) : calculateDistance(center, e.lnglat);

		// 清除预览
		if (previewOverlay.value) {
			map.removeOverLay(previewOverlay.value);
		}

		// 创建最终圆形
		const circle = new T.Circle(center, radius, {
			color: '#52c41a',
			weight: 2,
			opacity: 0.8,
			fillColor: '#52c41a',
			fillOpacity: 0.3,
		});
		map.addOverLay(circle);

		// 模拟CircleTool的事件参数
		const eventData = {
			currentCenter: center,
			currentRadius: radius,
			currentCircle: circle,
		};

		handleCircleDrawComplete(eventData);
		clearCustomDrawMode();
	}
};

// 处理自定义圆形鼠标移动
const handleCustomCircleMouseMove = (e: any) => {
	if (!firstClickPoint.value) return;

	const T = (window as any).T;
	const center = firstClickPoint.value;
	// 使用天地图API计算距离
	const radius = center.distanceTo ? center.distanceTo(e.lnglat) : calculateDistance(center, e.lnglat);

	// 清除之前的预览
	if (previewOverlay.value) {
		map.removeOverLay(previewOverlay.value);
	}

	// 创建预览圆形
	previewOverlay.value = new T.Circle(center, radius, {
		color: '#52c41a',
		weight: 1,
		opacity: 0.5,
		fillColor: '#52c41a',
		fillOpacity: 0.1,
	});
	map.addOverLay(previewOverlay.value);
};

// 处理自定义矩形点击
const handleCustomRectangleClick = (e: any) => {
	// 防止事件冒泡
	e.preventDefault?.();
	e.stopPropagation?.();

	if (!firstClickPoint.value) {
		// 第一次点击，设置起始点
		firstClickPoint.value = e.lnglat;
		ElMessage.info('已设置起始点，请移动鼠标并点击设置对角点');
	} else {
		// 第二次点击，完成矩形绘制
		const point1 = firstClickPoint.value;
		const point2 = e.lnglat;

		// 清除预览
		if (previewOverlay.value) {
			map.removeOverLay(previewOverlay.value);
		}

		// 计算矩形四个顶点
		const T = (window as any).T;
		const sw = new T.LngLat(Math.min(point1.lng, point2.lng), Math.min(point1.lat, point2.lat));
		const ne = new T.LngLat(Math.max(point1.lng, point2.lng), Math.max(point1.lat, point2.lat));
		const nw = new T.LngLat(sw.lng, ne.lat);
		const se = new T.LngLat(ne.lng, sw.lat);

		const points = [sw, nw, ne, se, sw];

		// 创建最终矩形
		const rectangle = new T.Polygon(points, {
			color: '#722ed1',
			weight: 2,
			opacity: 0.8,
			fillColor: '#722ed1',
			fillOpacity: 0.3,
		});
		map.addOverLay(rectangle);

		// 模拟RectangleTool的事件参数
		const bounds = new T.LngLatBounds(sw, ne);
		const eventData = {
			currentBounds: bounds,
			currentRectangle: rectangle,
		};

		handleRectangleDrawComplete(eventData);
		clearCustomDrawMode();
	}
};

// 处理自定义矩形鼠标移动
const handleCustomRectangleMouseMove = (e: any) => {
	if (!firstClickPoint.value) return;

	const point1 = firstClickPoint.value;
	const point2 = e.lnglat;

	// 清除之前的预览
	if (previewOverlay.value) {
		map.removeOverLay(previewOverlay.value);
	}

	// 计算矩形四个顶点
	const T = (window as any).T;
	const sw = new T.LngLat(Math.min(point1.lng, point2.lng), Math.min(point1.lat, point2.lat));
	const ne = new T.LngLat(Math.max(point1.lng, point2.lng), Math.max(point1.lat, point2.lat));
	const nw = new T.LngLat(sw.lng, ne.lat);
	const se = new T.LngLat(ne.lng, sw.lat);

	const points = [sw, nw, ne, se, sw];

	// 创建预览矩形
	previewOverlay.value = new T.Polygon(points, {
		color: '#722ed1',
		weight: 1,
		opacity: 0.5,
		fillColor: '#722ed1',
		fillOpacity: 0.1,
	});
	map.addOverLay(previewOverlay.value);
};

// 取消自定义绘制
const cancelCustomDrawing = () => {
	ElMessage.info('已取消绘制');
	clearCustomDrawMode();
	// 重置工具按钮状态
	document.querySelectorAll('.drawing-tools-container button').forEach((btn) => {
		btn.classList.remove('active');
		(btn as HTMLElement).style.borderColor = '#d9d9d9';
		(btn as HTMLElement).style.backgroundColor = 'white';
	});
};

// 清除自定义绘制模式
const clearCustomDrawMode = () => {
	// 恢复默认鼠标样式
	if (mapContainer.value) {
		mapContainer.value.style.cursor = 'default';
	}

	// 移除事件监听
	if (customDrawMode.value === 'circle') {
		map.removeEventListener('click', handleCustomCircleClick);
		map.removeEventListener('mousemove', handleCustomCircleMouseMove);
		map.removeEventListener('rightclick', cancelCustomDrawing);
		document.removeEventListener('keydown', handleEscapeKey);
	} else if (customDrawMode.value === 'rectangle') {
		map.removeEventListener('click', handleCustomRectangleClick);
		map.removeEventListener('mousemove', handleCustomRectangleMouseMove);
		map.removeEventListener('rightclick', cancelCustomDrawing);
		document.removeEventListener('keydown', handleEscapeKey);
	}

	// 清除预览
	if (previewOverlay.value) {
		map.removeOverLay(previewOverlay.value);
		previewOverlay.value = null;
	}

	// 重置状态
	customDrawMode.value = '';
	firstClickPoint.value = null;
};
</script>

<style scoped lang="scss">
.fence-template-container {
	height: 600px;

	.map-content {
		display: flex;
		height: 100%;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #e4e7ed;

		.map-left {
			flex: 1;
			position: relative;

			.map-placeholder {
				width: 100%;
				height: 100%;
				position: relative;
				background: #f5f5f5;

				.map-loading,
				.map-error {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 12px;
					color: #666;

					.el-icon {
						font-size: 32px;
					}
				}
			}
		}

		.map-right {
			width: 320px;
			background: #fafafa;
			border-left: 1px solid #e4e7ed;
			padding: 16px;
			overflow-y: auto;

			.section-title {
				margin: 0 0 12px 0;
				font-size: 14px;
				font-weight: 600;
				color: #303133;
				display: flex;
				align-items: center;
				gap: 6px;

				.template-count {
					font-weight: normal;
					color: #909399;
					font-size: 12px;
				}
			}

			.drawing-info {
				margin-bottom: 24px;
				padding: 16px;
				background: white;
				border-radius: 8px;
				border: 1px solid #e4e7ed;

				.drawing-actions {
					margin-top: 16px;
					display: flex;
					gap: 8px;

					.el-button {
						flex: 1;
					}
				}
			}

			.drawing-tips {
				margin-bottom: 24px;

				.tips-content {
					padding: 16px;
					background: white;
					border-radius: 8px;
					border: 1px solid #e4e7ed;

					p {
						margin: 0 0 8px 0;
						font-size: 13px;
						color: #303133;
					}

					ul {
						margin: 0 0 16px 0;
						padding-left: 20px;

						li {
							margin-bottom: 4px;
							font-size: 12px;
							color: #606266;
							line-height: 1.4;

							strong {
								color: #303133;
							}
						}
					}
				}
			}

			.template-list {
				.template-items {
					.template-item {
						padding: 12px;
						margin-bottom: 8px;
						background: white;
						border-radius: 6px;
						border: 1px solid #e4e7ed;
						cursor: pointer;
						transition: all 0.2s;

						&:hover {
							border-color: #409eff;
							box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
						}

						.template-header {
							display: flex;
							align-items: center;
							justify-content: space-between;
							margin-bottom: 8px;

							.template-name {
								font-size: 13px;
								font-weight: 500;
								color: #303133;
							}
						}

						.template-meta {
							display: flex;
							align-items: center;
							justify-content: space-between;

							.template-time {
								font-size: 11px;
								color: #909399;
							}
						}
					}
				}
			}
		}
	}
}

// 绘图工具样式
:deep(.drawing-tools-container) {
	.active {
		border-color: #409eff !important;
		background-color: #e6f7ff !important;
	}
}
</style>
