<template>
	<div class="system-user-box-container">
		<el-dialog title="用户关联箱体" v-model="isShowDialog" width="1200px">
			<div class="system-user-box-search mb15">
				<el-form :inline="true" :model="queryParams">
					<el-form-item label="箱体编号">
						<el-input v-model="queryParams.boxId" placeholder="请输入箱体编号" clearable class="w-50 m-2" @keyup.enter="handleQuery" />
					</el-form-item>
					<el-form-item>
						<el-button type="primary" class="ml10" @click="handleQuery">
							<el-icon>
								<ele-Search />
							</el-icon>
							查询
						</el-button>
					</el-form-item>
					<el-form-item class="right-button-item">
						<el-button type="success" class="ml10" @click="handleBindBox">
							<el-icon>
								<ele-Plus />
							</el-icon>
							绑定箱体
						</el-button>
					</el-form-item>
				</el-form>
			</div>
			<el-table :data="tableData.data" style="width: 100%" v-loading="loading">
				<el-table-column prop="boxId" label="编号ID" min-width="120" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="specification" label="规格" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="primary" v-if="scope.row.specification === BoxSpecification.SUITCASE">{{
							BoxSpecificationLabel[scope.row.specification]
						}}</el-tag>
						<el-tag type="warning" v-else-if="scope.row.specification === BoxSpecification.TROLLEY">{{
							BoxSpecificationLabel[scope.row.specification]
						}}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="taskStatus" label="任务状态" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="warning" v-if="scope.row.taskStatus === BoxTaskStatus.RUNNING">{{ BoxTaskStatusLabel[scope.row.taskStatus] }}</el-tag>
						<el-tag type="info" v-else>{{ BoxTaskStatusLabel[scope.row.taskStatus] }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="coverStatus" label="开盖状态" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="danger" v-if="scope.row.coverStatus === BoxCoverStatus.OPEN">{{ BoxCoverStatusLabel[scope.row.coverStatus] }}</el-tag>
						<el-tag type="success" v-else>{{ BoxCoverStatusLabel[scope.row.coverStatus] }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="healthStatus" label="健康状态" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.healthStatus === BoxHealthStatus.HEALTHY">{{
							BoxHealthStatusLabel[scope.row.healthStatus]
						}}</el-tag>
						<el-tag type="danger" v-else>{{ BoxHealthStatusLabel[scope.row.healthStatus] }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="fenceStatus" label="电子围栏" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.fenceStatus === BoxFenceStatus.NORMAL">{{ BoxFenceStatusLabel[scope.row.fenceStatus] }}</el-tag>
						<el-tag type="warning" v-else>{{ BoxFenceStatusLabel[scope.row.fenceStatus] }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="batteryLevel" label="电量状态" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<span :style="{ color: scope.row.batteryLevel < 20 ? '#F56C6C' : '#67C23A' }">{{ scope.row.batteryLevel }}%</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="200" fixed="right">
					<template #default="scope">
						<el-button size="small" text type="success" @click="handleRemoteOpen(scope.row)">远程开箱</el-button>
						<el-button size="small" text type="primary" @click="handleLocation(scope.row)">当前定位</el-button>
						<el-button size="small" text type="danger" @click="handleUnbind(scope.row)">解绑</el-button>
					</template>
				</el-table-column>
			</el-table>
			<pagination
				v-show="tableData.total > 0"
				:total="tableData.total"
				v-model:page="queryParams.pageNum"
				v-model:limit="queryParams.pageSize"
				@pagination="handleQuery"
				class="pagination-container"
			/>
		</el-dialog>
		<LocationMap ref="locationMapRef" />
	</div>
</template>

<script setup lang="ts">
import { reactive, toRefs, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import {
	BoxSpecification,
	BoxSpecificationLabel,
	BoxTaskStatus,
	BoxTaskStatusLabel,
	BoxCoverStatus,
	BoxCoverStatusLabel,
	BoxHealthStatus,
	BoxHealthStatusLabel,
	BoxFenceStatus,
	BoxFenceStatusLabel,
	type UserBox,
	type UserBoxQueryParams,
} from '../types';
import LocationMap from './locationMap.vue';

defineOptions({ name: 'systemUserBoxList' });

// 状态定义
interface State {
	isShowDialog: boolean;
	loading: boolean;
	queryParams: UserBoxQueryParams;
	tableData: {
		data: UserBox[];
		total: number;
	};
}

const state = reactive<State>({
	isShowDialog: false,
	loading: false,
	queryParams: {
		boxId: '',
		specification: '',
		taskStatus: '',
		pageNum: 1,
		pageSize: 10,
	},
	tableData: {
		data: [],
		total: 0,
	},
});

const { isShowDialog, loading, queryParams, tableData } = toRefs(state);

const locationMapRef = ref();

// 打开弹窗
const openDialog = (userId: number) => {
	state.isShowDialog = true;
	getUserBoxList();
};

// 获取用户关联箱体列表
const getUserBoxList = () => {
	state.loading = true;
	// 模拟数据
	const mockData: UserBox[] = [
		{
			id: 1,
			boxId: 'BOX001',
			specification: BoxSpecification.SUITCASE,
			taskStatus: BoxTaskStatus.RUNNING,
			coverStatus: BoxCoverStatus.CLOSED,
			healthStatus: BoxHealthStatus.HEALTHY,
			fenceStatus: BoxFenceStatus.NORMAL,
			batteryLevel: 85,
		},
		{
			id: 2,
			boxId: 'BOX002',
			specification: BoxSpecification.TROLLEY,
			taskStatus: BoxTaskStatus.IDLE,
			coverStatus: BoxCoverStatus.OPEN,
			healthStatus: BoxHealthStatus.ABNORMAL,
			fenceStatus: BoxFenceStatus.WARNING,
			batteryLevel: 15,
		},
	];

	// 根据查询条件过滤数据
	let filteredData = mockData;
	if (state.queryParams.boxId) {
		filteredData = filteredData.filter((item) => item.boxId.toLowerCase().includes(state.queryParams.boxId.toLowerCase()));
	}
	if (state.queryParams.specification) {
		filteredData = filteredData.filter((item) => item.specification === state.queryParams.specification);
	}
	if (state.queryParams.taskStatus) {
		filteredData = filteredData.filter((item) => item.taskStatus === state.queryParams.taskStatus);
	}

	// 模拟分页
	const startIndex = (state.queryParams.pageNum - 1) * state.queryParams.pageSize;
	const endIndex = startIndex + state.queryParams.pageSize;
	state.tableData.data = filteredData.slice(startIndex, endIndex);
	state.tableData.total = filteredData.length;
	state.loading = false;
};

// 查询
const handleQuery = () => {
	state.queryParams.pageNum = 1;
	getUserBoxList();
};

// 绑定箱体
const handleBindBox = () => {
	ElMessage.info('绑定箱体功能开发中...');
};

// 远程开箱
const handleRemoteOpen = (row: UserBox) => {
	ElMessageBox.confirm(`确定要远程开启箱体："${row.boxId}"吗？`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			ElMessage.success('远程开箱指令已发送');
		})
		.catch(() => {});
};

// 解绑箱体
const handleUnbind = (row: UserBox) => {
	ElMessageBox.confirm(`确定要解绑箱体："${row.boxId}"吗？`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			ElMessage.success('解绑成功');
			getUserBoxList();
		})
		.catch(() => {});
};

// 处理查看定位信息
const handleLocation = (row: any) => {
	locationMapRef.value.openDialog(row.boxId);
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.system-user-box-container {
	.mb15 {
		margin-bottom: 15px;
	}
	.ml10 {
		margin-left: 10px;
	}
	.w-50 {
		width: 200px;
	}
}

.system-user-box-search {
	.el-form {
		display: flex;
		align-items: center;
		.el-form-item {
			margin-bottom: 0;

			&.right-button-item {
				margin-left: auto;
			}
		}
	}
}

.pagination-container {
	display: flex;
	justify-content: flex-end;
	margin-top: 20px;
}
</style>
