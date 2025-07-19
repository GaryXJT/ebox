<template>
	<div class="system-box-container">
		<el-card shadow="hover">
			<div class="system-user-search mb15">
				<el-form :inline="true">
					<el-form-item label="编号搜索">
						<el-input v-model="tableData.param.boxId" placeholder="请输入箱体编号" class="w-50 m-2" clearable />
					</el-form-item>
					<el-form-item>
						<el-button size="default" type="primary" class="ml10" @click="boxList">
							<el-icon>
								<ele-Search />
							</el-icon>
							查询
						</el-button>
					</el-form-item>
					<div class="right-button-group">
						<el-button size="default" type="success" class="ml10" @click="onOpenAddBox">
							<el-icon>
								<ele-FolderAdd />
							</el-icon>
							箱体授权管理
						</el-button>
						<el-button size="default" type="danger" class="ml10" @click="onRowDel(null)">
							<el-icon>
								<ele-Delete />
							</el-icon>
							批量删除
						</el-button>
					</div>
				</el-form>
			</div>
			<el-table :data="tableData.data" style="width: 100%" @selection-change="handleSelectionChange">
				<el-table-column type="selection" width="55" align="center" />
				<el-table-column type="index" label="序号" width="60" sortable />
				<el-table-column prop="boxId" label="编号ID" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="specification" label="规格" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="primary" v-if="scope.row.specification === 'suitcase'">手提箱</el-tag>
						<el-tag type="warning" v-else-if="scope.row.specification === 'trolley'">拉杆箱</el-tag>
						<el-tag v-else>{{ scope.row.specification }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="bindingStatus" label="绑定状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.bindingStatus">是</el-tag>
						<el-tag type="info" v-else>否</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="taskStatus" label="任务状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="warning" v-if="scope.row.taskStatus === 'running'">任务中</el-tag>
						<el-tag type="info" v-else>无</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="coverStatus" label="开盖状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="danger" v-if="scope.row.coverStatus === 'open'">开</el-tag>
						<el-tag type="success" v-else>关</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="healthStatus" label="健康状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.healthStatus === 'healthy'">健康</el-tag>
						<el-tag type="danger" v-else>异常</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="fenceStatus" label="电子围栏状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.fenceStatus === 'normal'">正常</el-tag>
						<el-tag type="warning" v-else>警告</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="batteryLevel" label="电量状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<span :style="{ color: scope.row.batteryLevel < 20 ? '#F56C6C' : '#67C23A' }"> {{ scope.row.batteryLevel }}% </span>
					</template>
				</el-table-column>
				<el-table-column prop="createdAt" label="创建时间" width="180" show-overflow-tooltip sortable></el-table-column>
				<el-table-column label="操作" width="240">
					<template #default="scope">
						<el-button size="small" text type="primary" @click="onGetLocation(scope.row)">当前定位</el-button>
						<el-button size="small" text type="primary" @click="onGetTrajectory(scope.row)">轨迹记录</el-button>
						<el-button size="small" text type="success" @click="onActivateBox(scope.row)">激活</el-button>
						<el-button size="small" text type="danger" @click="onRowDel(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
			<pagination
				v-show="tableData.total > 0"
				:total="tableData.total"
				v-model:page="tableData.param.pageNum"
				v-model:limit="tableData.param.pageSize"
				@pagination="boxList"
				class="pagination-container"
			/>
		</el-card>
		<!-- <EditBox ref="editBoxRef" @getBoxList="boxList" /> -->
		<LocationMap ref="locationMapRef" />
	</div>
</template>

<script setup lang="ts">
import { toRefs, reactive, onMounted, ref, defineComponent, toRaw } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
// import EditBox from '/@/views/system/box/component/editBox.vue';
import LocationMap from '/@/views/system/users/component/locationMap.vue';
import { deleteBox, getBoxList, getBoxLocation, getBoxTrajectory, activateBox } from '/@/api/system/box';
// TODO：定位 电子围栏的弹窗，用户那边相关箱体的轨迹记录 两边应该可以用一个组件
// 定义接口来定义对象的类型
interface TableData {
	id: number;
	boxId: string;
	specification: string;
	bindingStatus: boolean;
	taskStatus: string;
	coverStatus: string;
	healthStatus: string;
	fenceStatus: string;
	batteryLevel: number;
	createdAt: string;
}
interface TableDataState {
	ids: number[];
	tableData: {
		data: Array<TableData>;
		total: number;
		loading: boolean;
		param: {
			boxId: string;
			pageNum: number;
			pageSize: number;
		};
	};
}
defineOptions({ name: 'apiV1SystemBoxList' });
const addBoxRef = ref();
// const editBoxRef = ref(); // 暂时注释掉
const locationMapRef = ref();
const state = reactive<TableDataState>({
	ids: [],
	tableData: {
		data: [],
		total: 0,
		loading: false,
		param: {
			boxId: '',
			pageNum: 1,
			pageSize: 10,
		},
	},
});
const { tableData } = toRefs(state);
// 初始化表格数据
const initTableData = () => {
	boxList();
};
const boxList = () => {
	// 暂时使用模拟数据，后端接口通了之后再启用真实API
	// getBoxList(state.tableData.param).then(res=>{
	//   state.tableData.data = res.data.boxList??[];
	//   state.tableData.total = res.data.total;
	// })

	// 模拟数据
	const mockData = [
		{
			id: 1,
			boxId: 'BOX001',
			specification: 'suitcase',
			bindingStatus: true,
			taskStatus: 'running',
			coverStatus: 'closed',
			healthStatus: 'healthy',
			fenceStatus: 'normal',
			batteryLevel: 85,
			createdAt: '2024-01-15 10:30:00',
		},
		{
			id: 2,
			boxId: 'BOX002',
			specification: 'trolley',
			bindingStatus: false,
			taskStatus: 'idle',
			coverStatus: 'open',
			healthStatus: 'abnormal',
			fenceStatus: 'warning',
			batteryLevel: 15,
			createdAt: '2024-01-14 14:20:00',
		},
		{
			id: 3,
			boxId: 'BOX003',
			specification: 'suitcase',
			bindingStatus: true,
			taskStatus: 'idle',
			coverStatus: 'closed',
			healthStatus: 'healthy',
			fenceStatus: 'normal',
			batteryLevel: 92,
			createdAt: '2024-01-13 09:15:00',
		},
		{
			id: 4,
			boxId: 'BOX004',
			specification: 'trolley',
			bindingStatus: true,
			taskStatus: 'running',
			coverStatus: 'closed',
			healthStatus: 'healthy',
			fenceStatus: 'normal',
			batteryLevel: 67,
			createdAt: '2024-01-12 16:45:00',
		},
		{
			id: 5,
			boxId: 'BOX005',
			specification: 'suitcase',
			bindingStatus: false,
			taskStatus: 'idle',
			coverStatus: 'open',
			healthStatus: 'abnormal',
			fenceStatus: 'warning',
			batteryLevel: 8,
			createdAt: '2024-01-11 11:30:00',
		},
		{
			id: 6,
			boxId: 'BOX006',
			specification: 'trolley',
			bindingStatus: true,
			taskStatus: 'idle',
			coverStatus: 'closed',
			healthStatus: 'healthy',
			fenceStatus: 'normal',
			batteryLevel: 78,
			createdAt: '2024-01-10 13:20:00',
		},
		{
			id: 7,
			boxId: 'BOX007',
			specification: 'suitcase',
			bindingStatus: true,
			taskStatus: 'running',
			coverStatus: 'closed',
			healthStatus: 'healthy',
			fenceStatus: 'normal',
			batteryLevel: 95,
			createdAt: '2024-01-09 08:10:00',
		},
		{
			id: 8,
			boxId: 'BOX008',
			specification: 'trolley',
			bindingStatus: false,
			taskStatus: 'idle',
			coverStatus: 'open',
			healthStatus: 'abnormal',
			fenceStatus: 'warning',
			batteryLevel: 3,
			createdAt: '2024-01-08 15:55:00',
		},
	];

	// 根据搜索条件过滤数据
	let filteredData = mockData;
	if (state.tableData.param.boxId) {
		filteredData = mockData.filter((item) => item.boxId.toLowerCase().includes(state.tableData.param.boxId.toLowerCase()));
	}

	// 模拟分页
	const pageSize = state.tableData.param.pageSize;
	const pageNum = state.tableData.param.pageNum;
	const startIndex = (pageNum - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	state.tableData.data = filteredData.slice(startIndex, endIndex);
	state.tableData.total = filteredData.length;
};
// 打开新增箱体弹窗
const onOpenAddBox = () => {
	// editBoxRef.value.openDialog(); // 暂时注释掉，先让主页面正常显示模拟数据
	ElMessage.info('箱体授权管理功能开发中...');
};
// 打开修改箱体弹窗
const onOpenEditBox = (row: Object) => {
	// editBoxRef.value.openDialog(toRaw(row)); // 暂时注释掉，先让主页面正常显示模拟数据
	ElMessage.info('编辑功能开发中...');
};
// 获取当前定位
const onGetLocation = (row: any) => {
	// 直接打开定位地图弹窗
	locationMapRef.value?.openDialog(row.boxId);
};
// 查看轨迹记录
const onGetTrajectory = (row: any) => {
	// 打开轨迹地图弹窗，自动播放轨迹
	locationMapRef.value?.openDialog(row.boxId, 'track');
};
// 激活箱体
const onActivateBox = (row: any) => {
	ElMessageBox.confirm(`确定要激活箱体："${row.boxId}"吗？`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			// activateBox(row.id).then(()=>{
			//   ElMessage.success('箱体激活成功');
			//   boxList();
			// })

			// 模拟激活成功
			ElMessage.success('箱体激活成功');
			boxList();
		})
		.catch(() => {});
};
// 删除箱体
const onRowDel = (row: any) => {
	let msg = '你确定要删除所选箱体库存？';
	let ids: number[] = [];
	if (row) {
		msg = `此操作将永久删除箱体："${row.boxId}"，是否继续?`;
		ids = [row.id];
	} else {
		ids = state.ids;
	}
	if (ids.length === 0) {
		ElMessage.error('请选择要删除的数据。');
		return;
	}
	ElMessageBox.confirm(msg, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			// deleteBox(ids).then(()=>{
			//   ElMessage.success('删除成功');
			//   boxList();
			// })

			// 模拟删除成功
			ElMessage.success('删除成功');
			boxList();
		})
		.catch(() => {});
};
// 分页改变
const onHandleSizeChange = (val: number) => {
	state.tableData.param.pageSize = val;
};
// 分页改变
const onHandleCurrentChange = (val: number) => {
	state.tableData.param.pageNum = val;
};
// 页面加载时
onMounted(() => {
	initTableData();
});
// 多选框选中数据
const handleSelectionChange = (selection: Array<TableData>) => {
	state.ids = selection.map((item) => item.id);
};
</script>

<style scoped lang="scss">
.system-box-container {
	.system-user-search {
		.el-form {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			.el-form-item {
				margin-bottom: 0;
			}
			.right-button-group {
				margin-left: auto;
				display: flex;
				align-items: center;
			}
		}
	}
	.pagination-container {
		display: flex;
		justify-content: flex-end;
		margin-top: 20px;
	}
}
</style>
