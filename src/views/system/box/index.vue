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
						<el-button size="default" type="success" class="ml10" @click="onOpenAuthDialog">
							<el-icon>
								<ele-FolderAdd />
							</el-icon>
							箱体授权（不急）
						</el-button>
						<el-button size="default" type="warning" class="ml10" @click="onOpenFenceTemplate">
							<el-icon>
								<ele-Setting />
							</el-icon>
							电子围栏模板
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
				<el-table-column prop="bindUser" label="所属用户" show-overflow-tooltip sortable>
					<template #default="scope">
						<span v-if="scope.row.bindUser" class="user-info">
							<el-tag type="primary">{{ scope.row.bindUser.name }}</el-tag>
							<span class="user-dept">{{ scope.row.bindUser.dept }}</span>
						</span>
						<el-tag type="info" v-else>未绑定</el-tag>
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
				<el-table-column label="操作" width="280">
					<template #default="scope">
						<el-button size="small" text type="primary" @click="onGetLocation(scope.row)">当前定位</el-button>
						<el-button size="small" text type="primary" @click="onGetTrajectory(scope.row)">轨迹记录</el-button>
						<el-button size="small" text type="warning" @click="onBindFence(scope.row)">绑定电子围栏</el-button>
						<el-dropdown trigger="hover" @command="(command: string) => handleMoreAction(command, scope.row)">
							<el-button size="small" text type="primary" style="margin-left: 10px">
								更多<el-icon class="el-icon--right"><ele-ArrowDown /></el-icon>
							</el-button>
							<template #dropdown>
								<el-dropdown-menu>
									<el-dropdown-item command="activate" :icon="'ele-VideoPlay'">激活</el-dropdown-item>
									<el-dropdown-item command="unbind" :icon="'ele-Connection'" :disabled="!scope.row.bindUser">解绑用户</el-dropdown-item>
									<el-dropdown-item command="bind" :icon="'ele-User'">绑定用户</el-dropdown-item>
									<el-dropdown-item command="remoteOpen" :icon="'ele-Unlock'" divided>远程开箱</el-dropdown-item>
									<el-dropdown-item command="delete" :icon="'ele-Delete'" divided>删除</el-dropdown-item>
								</el-dropdown-menu>
							</template>
						</el-dropdown>
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
		<LocationMap ref="locationMapRef" />
		<FenceTemplateDialog v-model:visible="fenceTemplateVisible" />

		<!-- 删除确认对话框 -->
		<el-dialog v-model="deleteDialog.visible" title="删除确认" width="450px" :close-on-click-modal="false" :close-on-press-escape="false">
			<div class="delete-warning">
				<el-icon class="warning-icon"><ele-Warning /></el-icon>
				<div class="warning-content">
					<p class="warning-title">危险操作警告</p>
					<p class="warning-text">此操作将永久删除箱体："{{ deleteDialog.boxId }}"，删除后无法恢复！</p>
					<div class="password-input">
						<el-form-item label="请输入登录密码确认：" label-width="140px">
							<el-input v-model="deleteDialog.password" type="password" placeholder="请输入当前登录账户密码" show-password clearable />
						</el-form-item>
					</div>
				</div>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelDelete">取消</el-button>
					<el-button type="danger" :disabled="!deleteDialog.password || deleteDialog.countdown > 0" @click="confirmDelete">
						{{ deleteDialog.countdown > 0 ? `${deleteDialog.countdown}s 后可删除` : '确认删除' }}
					</el-button>
				</div>
			</template>
		</el-dialog>

		<!-- 解绑用户确认对话框 -->
		<el-dialog v-model="unbindDialog.visible" title="解绑确认" width="400px">
			<div class="unbind-warning">
				<el-icon class="warning-icon"><ele-Warning /></el-icon>
				<div class="warning-content">
					<p class="warning-title">解绑确认</p>
					<p class="warning-text">确定要解绑箱体"{{ unbindDialog.boxId }}"与用户"{{ unbindDialog.userName }}"的绑定关系吗？</p>
				</div>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelUnbind">取消</el-button>
					<el-button type="warning" :disabled="unbindDialog.countdown > 0" @click="confirmUnbind">
						{{ unbindDialog.countdown > 0 ? `${unbindDialog.countdown}s 后可解绑` : '确认解绑' }}
					</el-button>
				</div>
			</template>
		</el-dialog>

		<!-- 绑定用户对话框 -->
		<el-dialog v-model="bindDialog.visible" title="绑定用户" width="500px">
			<el-form :model="bindDialog" label-width="100px">
				<el-form-item label="箱体编号：">
					<el-input v-model="bindDialog.boxId" disabled />
				</el-form-item>
				<el-form-item label="选择用户：" required>
					<el-select v-model="bindDialog.selectedUser" placeholder="请选择要绑定的用户" style="width: 100%">
						<el-option v-for="user in userList" :key="user.id" :label="`${user.name} (${user.dept})`" :value="user.id" />
					</el-select>
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelBind">取消</el-button>
					<el-button type="primary" :disabled="!bindDialog.selectedUser" @click="confirmBind">确认绑定</el-button>
				</div>
			</template>
		</el-dialog>

		<!-- 远程开箱确认对话框 -->
		<el-dialog v-model="remoteOpenDialog.visible" title="远程开箱" width="400px">
			<div class="remote-open-warning">
				<el-icon class="warning-icon"><ele-Unlock /></el-icon>
				<div class="warning-content">
					<p class="warning-title">远程开箱确认</p>
					<p class="warning-text">确定要远程开启箱体"{{ remoteOpenDialog.boxId }}"吗？</p>
					<p class="info-text">开箱后请确保箱体处于安全环境中。</p>
				</div>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelRemoteOpen">取消</el-button>
					<el-button type="primary" @click="confirmRemoteOpen">确认开箱</el-button>
				</div>
			</template>
		</el-dialog>

		<!-- 箱体授权信息对话框 -->
		<el-dialog v-model="authDialog.visible" title="授权信息" width="500px">
			<div class="auth-header">
				<el-button type="primary" @click="showImportDialog">
					<el-icon><ele-Upload /></el-icon>
					导入
				</el-button>
				<el-button type="info" @click="showMachineCodeDialog">
					<el-icon><ele-Key /></el-icon>
					查询机器码
				</el-button>
			</div>
			<div class="auth-info">
				<el-descriptions :column="1" border>
					<el-descriptions-item label="已用数量">{{ authInfo.used }}</el-descriptions-item>
					<el-descriptions-item label="可用数量">{{ authInfo.available }}</el-descriptions-item>
					<el-descriptions-item label="已购买总数">{{ authInfo.total }}</el-descriptions-item>
				</el-descriptions>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="closeAuthDialog">关闭</el-button>
				</div>
			</template>
		</el-dialog>

		<!-- 导入CDK对话框 -->
		<el-dialog v-model="importDialog.visible" title="导入CDK" width="500px">
			<el-form :model="importDialog" label-width="80px">
				<el-form-item label="CDK：" required>
					<el-input v-model="importDialog.cdk" placeholder="请输入CDK码" clearable show-word-limit style="width: 100%" />
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelImport">取消</el-button>
					<el-button type="primary" :disabled="!importDialog.cdk" @click="confirmImport">确认</el-button>
				</div>
			</template>
		</el-dialog>

		<!-- 机器码查询对话框 -->
		<el-dialog v-model="machineCodeDialog.visible" title="机器码信息" width="450px">
			<div class="machine-code-info">
				<div class="machine-code-display">
					<div class="machine-code-text">{{ machineCodeDialog.code }}</div>
					<el-button type="primary" @click="copyMachineCode">
						<el-icon><ele-CopyDocument /></el-icon>
						复制
					</el-button>
				</div>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="closeMachineCodeDialog">关闭</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { toRefs, reactive, onMounted, ref, defineComponent, toRaw } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import LocationMap from '/@/views/system/users/component/locationMap.vue';
import FenceTemplateDialog from './component/FenceTemplateDialog.vue';
import { deleteBox, getBoxList, getBoxLocation, getBoxTrajectory, activateBox } from '/@/api/system/box';
// TODO：定位 电子围栏的弹窗，用户那边相关箱体的轨迹记录 两边应该可以用一个组件
// 定义接口来定义对象的类型
interface TableData {
	id: number;
	boxId: string;
	specification: string;
	bindUser?: {
		name: string;
		dept: string;
	};
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
const locationMapRef = ref();
const fenceTemplateVisible = ref(false);
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

// 删除对话框状态
const deleteDialog = reactive({
	visible: false,
	boxId: '',
	rowData: null as TableData | null,
	password: '',
	countdown: 0,
});

// 解绑对话框状态
const unbindDialog = reactive({
	visible: false,
	boxId: '',
	userName: '',
	rowData: null as TableData | null,
	countdown: 0,
});

// 绑定对话框状态
const bindDialog = reactive({
	visible: false,
	boxId: '',
	selectedUser: '',
	rowData: null as TableData | null,
});

// 远程开箱对话框状态
const remoteOpenDialog = reactive({
	visible: false,
	boxId: '',
	rowData: null as TableData | null,
});

// 用户列表（模拟数据）
const userList = ref([
	{ id: 'user001', name: '张三', dept: '研发部' },
	{ id: 'user002', name: '李四', dept: '市场部' },
	{ id: 'user003', name: '王五', dept: '财务部' },
	{ id: 'user004', name: '赵六', dept: '人事部' },
	{ id: 'user005', name: '孙七', dept: '运营部' },
	{ id: 'user006', name: '周八', dept: '技术部' },
]);

// 箱体授权对话框状态
const authDialog = reactive({
	visible: false,
});

// 授权信息数据
const authInfo = reactive({
	used: 15,
	available: 35,
	total: 50,
});

// 导入CDK对话框状态
const importDialog = reactive({
	visible: false,
	cdk: '',
});

// 机器码对话框状态
const machineCodeDialog = reactive({
	visible: false,
	code: 'ABC123-DEF456-GHI789-JKL012',
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
			bindUser: { name: '张三', dept: '研发部' },
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
			bindUser: undefined,
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
			bindUser: { name: '李四', dept: '市场部' },
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
			bindUser: { name: '王五', dept: '财务部' },
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
			bindUser: undefined,
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
			bindUser: { name: '赵六', dept: '人事部' },
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
			bindUser: { name: '孙七', dept: '运营部' },
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
			bindUser: undefined,
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
// 打开箱体授权对话框
const onOpenAuthDialog = () => {
	authDialog.visible = true;
};

// 打开电子围栏模板
const onOpenFenceTemplate = () => {
	fenceTemplateVisible.value = true;
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

// 处理更多操作
const handleMoreAction = (command: string, row: TableData) => {
	if (command === 'activate') {
		onActivateBox(row);
	} else if (command === 'delete') {
		showDeleteDialog(row);
	} else if (command === 'unbind') {
		showUnbindDialog(row);
	} else if (command === 'bind') {
		showBindDialog(row);
	} else if (command === 'remoteOpen') {
		showRemoteOpenDialog(row);
	}
};

// 显示删除确认对话框
const showDeleteDialog = (row: TableData) => {
	deleteDialog.visible = true;
	deleteDialog.boxId = row.boxId;
	deleteDialog.rowData = row;
	deleteDialog.password = '';
	deleteDialog.countdown = 5; // 5秒倒计时

	// 开始倒计时
	const countdownTimer = setInterval(() => {
		deleteDialog.countdown--;
		if (deleteDialog.countdown <= 0) {
			clearInterval(countdownTimer);
		}
	}, 1000);
};

// 取消删除
const cancelDelete = () => {
	deleteDialog.visible = false;
	deleteDialog.boxId = '';
	deleteDialog.rowData = null;
	deleteDialog.password = '';
	deleteDialog.countdown = 0;
};

// 确认删除
const confirmDelete = () => {
	if (!deleteDialog.password) {
		ElMessage.error('请输入登录密码');
		return;
	}

	// 这里应该验证密码，暂时使用模拟验证
	if (deleteDialog.password !== 'admin123') {
		ElMessage.error('密码错误，无法删除');
		return;
	}

	// 执行删除操作
	ElMessage.success('删除成功');
	cancelDelete();
	boxList();
};

// 绑定电子围栏
const onBindFence = (row: TableData) => {
	ElMessage.info('绑定电子围栏功能开发中...');
};

// 显示解绑确认对话框
const showUnbindDialog = (row: TableData) => {
	if (!row.bindUser) {
		ElMessage.warning('该箱体尚未绑定用户');
		return;
	}

	unbindDialog.visible = true;
	unbindDialog.boxId = row.boxId;
	unbindDialog.userName = row.bindUser.name;
	unbindDialog.rowData = row;
	unbindDialog.countdown = 3; // 3秒倒计时

	// 开始倒计时
	const countdownTimer = setInterval(() => {
		unbindDialog.countdown--;
		if (unbindDialog.countdown <= 0) {
			clearInterval(countdownTimer);
		}
	}, 1000);
};

// 取消解绑
const cancelUnbind = () => {
	unbindDialog.visible = false;
	unbindDialog.boxId = '';
	unbindDialog.userName = '';
	unbindDialog.rowData = null;
	unbindDialog.countdown = 0;
};

// 确认解绑
const confirmUnbind = () => {
	ElMessage.success('解绑成功');
	// 这里应该调用API更新数据
	// 暂时更新本地数据
	if (unbindDialog.rowData) {
		unbindDialog.rowData.bindUser = undefined;
	}
	cancelUnbind();
	boxList();
};

// 显示绑定对话框
const showBindDialog = (row: TableData) => {
	bindDialog.visible = true;
	bindDialog.boxId = row.boxId;
	bindDialog.selectedUser = '';
	bindDialog.rowData = row;
};

// 取消绑定
const cancelBind = () => {
	bindDialog.visible = false;
	bindDialog.boxId = '';
	bindDialog.selectedUser = '';
	bindDialog.rowData = null;
};

// 确认绑定
const confirmBind = () => {
	if (!bindDialog.selectedUser) {
		ElMessage.error('请选择要绑定的用户');
		return;
	}

	// 查找选中的用户信息
	const selectedUserInfo = userList.value.find((user) => user.id === bindDialog.selectedUser);
	if (selectedUserInfo && bindDialog.rowData) {
		bindDialog.rowData.bindUser = {
			name: selectedUserInfo.name,
			dept: selectedUserInfo.dept,
		};
		ElMessage.success('绑定成功');
		cancelBind();
		boxList();
	}
};

// 显示远程开箱对话框
const showRemoteOpenDialog = (row: TableData) => {
	remoteOpenDialog.visible = true;
	remoteOpenDialog.boxId = row.boxId;
	remoteOpenDialog.rowData = row;
};

// 取消远程开箱
const cancelRemoteOpen = () => {
	remoteOpenDialog.visible = false;
	remoteOpenDialog.boxId = '';
	remoteOpenDialog.rowData = null;
};

// 确认远程开箱
const confirmRemoteOpen = () => {
	ElMessage.success('远程开箱指令已发送');
	// 这里应该调用API发送开箱指令
	// 暂时更新开盖状态
	if (remoteOpenDialog.rowData) {
		remoteOpenDialog.rowData.coverStatus = 'open';
	}
	cancelRemoteOpen();
	boxList();
};

// 关闭授权对话框
const closeAuthDialog = () => {
	authDialog.visible = false;
};

// 显示导入CDK对话框
const showImportDialog = () => {
	importDialog.visible = true;
	importDialog.cdk = '';
};

// 取消导入CDK
const cancelImport = () => {
	importDialog.visible = false;
	importDialog.cdk = '';
};

// 确认导入CDK
const confirmImport = () => {
	if (!importDialog.cdk.trim()) {
		ElMessage.error('请输入CDK码');
		return;
	}

	// 这里应该调用API验证CDK
	// 暂时使用模拟验证逻辑
	const validCdks = ['CDK123456', 'CDK789012', 'CDK345678'];
	const isValid = validCdks.includes(importDialog.cdk.trim());

	if (isValid) {
		ElMessage.success('CDK导入成功');
		// 更新授权信息
		authInfo.total += 10;
		authInfo.available += 10;
	} else {
		ElMessage.error('CDK无效，请检查后重试');
	}

	cancelImport();
};

// 显示机器码对话框
const showMachineCodeDialog = () => {
	machineCodeDialog.visible = true;
};

// 关闭机器码对话框
const closeMachineCodeDialog = () => {
	machineCodeDialog.visible = false;
};

// 复制机器码
const copyMachineCode = () => {
	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(machineCodeDialog.code)
			.then(() => {
				ElMessage.success('机器码已复制到剪贴板');
			})
			.catch(() => {
				ElMessage.error('复制失败，请手动复制');
			});
	} else {
		// 兼容不支持 Clipboard API 的浏览器
		const textArea = document.createElement('textarea');
		textArea.value = machineCodeDialog.code;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand('copy');
		document.body.removeChild(textArea);
		ElMessage.success('机器码已复制到剪贴板');
	}
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

	// 用户信息样式
	.user-info {
		display: flex;
		align-items: center;
		gap: 8px;

		.user-dept {
			color: #909399;
			font-size: 12px;
		}
	}

	// 删除确认对话框样式
	.delete-warning {
		display: flex;
		align-items: flex-start;
		gap: 12px;

		.warning-icon {
			color: #e6a23c;
			font-size: 24px;
			margin-top: 2px;
		}

		.warning-content {
			flex: 1;

			.warning-title {
				color: #e6a23c;
				font-weight: 600;
				font-size: 16px;
				margin: 0 0 8px 0;
			}

			.warning-text {
				color: #f56c6c;
				margin: 0 0 16px 0;
				line-height: 1.5;
			}

			.password-input {
				margin-top: 16px;
			}
		}
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	// 解绑确认对话框样式
	.unbind-warning {
		display: flex;
		align-items: flex-start;
		gap: 12px;

		.warning-icon {
			color: #e6a23c;
			font-size: 24px;
			margin-top: 2px;
		}

		.warning-content {
			flex: 1;

			.warning-title {
				color: #e6a23c;
				font-weight: 600;
				font-size: 16px;
				margin: 0 0 8px 0;
			}

			.warning-text {
				color: #303133;
				margin: 0;
				line-height: 1.5;
			}
		}
	}

	// 远程开箱确认对话框样式
	.remote-open-warning {
		display: flex;
		align-items: flex-start;
		gap: 12px;

		.warning-icon {
			color: #409eff;
			font-size: 24px;
			margin-top: 2px;
		}

		.warning-content {
			flex: 1;

			.warning-title {
				color: #409eff;
				font-weight: 600;
				font-size: 16px;
				margin: 0 0 8px 0;
			}

			.warning-text {
				color: #303133;
				margin: 0 0 8px 0;
				line-height: 1.5;
			}

			.info-text {
				color: #909399;
				margin: 0;
				font-size: 14px;
				line-height: 1.5;
			}
		}
	}

	// 箱体授权对话框样式
	.auth-header {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 1px solid #ebeef5;
	}

	.auth-info {
		margin-top: 20px;
	}

	// 机器码显示样式
	.machine-code-info {
		.machine-code-label {
			margin: 0 0 10px 0;
			font-weight: 600;
			color: #303133;
		}

		.machine-code-display {
			display: flex;
			gap: 10px;
			align-items: center;

			.machine-code-text {
				flex: 1;
				padding: 8px 12px;
				background-color: #f5f7fa;
				border: 1px solid #dcdfe6;
				border-radius: 4px;
				font-family: 'Courier New', monospace;
				font-size: 14px;
				color: #303133;
				user-select: all;
				word-break: break-all;
			}
		}
	}
}
</style>
