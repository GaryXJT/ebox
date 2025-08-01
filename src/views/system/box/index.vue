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
				<el-table-column prop="uuid" label="编号ID" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="name" label="名称" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="type" label="规格" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="primary" v-if="scope.row.type === 2">手提箱</el-tag>
						<el-tag type="warning" v-else-if="scope.row.type === 1">拉杆箱</el-tag>
						<el-tag v-else>未知</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="user_name" label="所属用户" show-overflow-tooltip sortable>
					<template #default="scope">
						<span v-if="scope.row.user_name" class="user-info">
							<span class="user-dept">{{ scope.row.user_name }}</span>
						</span>
						<el-tag type="info" v-else>未绑定</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="lock_stat" label="开盖状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="danger" v-if="scope.row.lock_stat === '0'">开</el-tag>
						<el-tag type="success" v-else>关</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="stat" label="激活状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="primary" v-if="scope.row.stat === 1">已激活</el-tag>
						<el-tag type="info" v-else>待激活</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="bt_stat" label="蓝牙状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.bt_stat === '1'">已连接</el-tag>
						<el-tag type="danger" v-else>未连接</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="soc" label="电量状态" show-overflow-tooltip sortable>
					<template #default="scope">
						<span :style="{ color: Math.abs(Number(scope.row.soc)) < 20 ? '#F56C6C' : '#67C23A' }">
							{{ Math.abs(Number(scope.row.soc)) }}%
							<el-tag size="small" type="success" v-if="Number(scope.row.soc) < 0">充电中</el-tag>
						</span>
					</template>
				</el-table-column>
				<el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip sortable>
					<template #default="scope">
						{{ formatDateTime(scope.row.created_at) }}
					</template>
				</el-table-column>
				<el-table-column prop="remarks" label="备注" show-overflow-tooltip sortable></el-table-column>
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
									<el-dropdown-item command="activate" :icon="'ele-VideoPlay'" :disabled="scope.row.stat === 1">激活</el-dropdown-item>
									<el-dropdown-item command="edit" :icon="'ele-Edit'">编辑</el-dropdown-item>
									<el-dropdown-item command="unbind" :icon="'ele-Connection'" :disabled="!scope.row.user_name">解绑用户</el-dropdown-item>
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
		<el-dialog v-model="deleteDialog.visible" title="删除确认" width="500px" :close-on-click-modal="false" :close-on-press-escape="false">
			<div class="delete-warning">
				<el-icon class="warning-icon"><ele-Warning /></el-icon>
				<div class="warning-content">
					<p class="warning-title">危险操作警告</p>
					<p class="warning-text">此操作将永久删除箱体："{{ deleteDialog.name }}"，删除后无法恢复！</p>
				</div>
			</div>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelDelete">取消</el-button>
					<el-button type="danger" :disabled="deleteDialog.countdown > 0" @click="confirmDelete">
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
					<p class="warning-text">确定要解绑箱体"{{ unbindDialog.uuid }}"与用户"{{ unbindDialog.userName }}"的绑定关系吗？</p>
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
					<el-input v-model="bindDialog.uuid" disabled />
				</el-form-item>

				<!-- 添加当前所属用户信息 -->
				<el-form-item label="当前所属：">
					<div v-if="bindDialog.currentUser" class="current-user-info">
						{{ bindDialog.currentUser.name }}
					</div>
					<div v-else class="no-user-info">
						<el-tag type="info">无</el-tag>
					</div>
				</el-form-item>

				<el-form-item label="选择用户：" required>
					<el-select v-model="bindDialog.selectedUser" placeholder="请选择要绑定的用户" style="width: 100%">
						<el-option v-for="user in bindDialog.userList" :key="user.id" :label="user.userNickname" :value="user.id" />
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
		<el-dialog v-model="remoteOpenDialog.visible" title="远程开箱" width="600px">
			<div class="remote-open-warning">
				<el-icon class="warning-icon"><ele-Unlock /></el-icon>
				<div class="warning-content">
					<p class="warning-title">远程开箱确认</p>
					<p class="warning-text">确定要远程开启箱体"{{ remoteOpenDialog.uuid }}"吗？</p>
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

		<!-- 激活/编辑箱体对话框 -->
		<el-dialog v-model="boxDialog.visible" :title="boxDialog.type === 'activate' ? '激活箱体' : '编辑箱体'" width="500px">
			<el-form :model="boxDialog.form" :rules="boxDialog.rules" ref="boxFormRef" label-width="100px">
				<el-form-item label="箱体编号">
					<el-input v-model="boxDialog.form.uuid" disabled />
				</el-form-item>
				<el-form-item label="箱体名称" prop="name">
					<el-input v-model="boxDialog.form.name" placeholder="请输入箱体名称" clearable />
				</el-form-item>
				<el-form-item label="箱体类型" prop="type">
					<el-select v-model="boxDialog.form.type" placeholder="请选择箱体类型" style="width: 100%">
						<el-option label="手提箱" :value="2" />
						<el-option label="拉杆箱" :value="1" />
					</el-select>
				</el-form-item>
				<el-form-item label="备注">
					<el-input v-model="boxDialog.form.remarks" type="textarea" placeholder="请输入备注信息" />
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancelBoxDialog">取消</el-button>
					<el-button type="primary" @click="confirmBoxDialog">{{ boxDialog.type === 'activate' ? '确认激活' : '确认修改' }}</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { toRefs, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import LocationMap from '/@/views/system/users/component/locationMap.vue';
import FenceTemplateDialog from './component/FenceTemplateDialog.vue';
import { getBoxDetail, getBoxListWithUser, deleteBox, activateBox, unlockBox, updateBox, bindUserBox, unbindUserBox } from '/@/api/system/box';
import { getUserList } from '/@/api/system/user';
import type { BoxInfo, BoxQueryParams } from '/@/api/system/box/types';
import { formatDateTime } from '/@/utils/dateUtil';

// 定义接口来定义对象的类型
interface TableDataState {
	ids: number[];
	tableData: {
		data: Array<BoxInfo>;
		total: number;
		loading: boolean;
		param: BoxQueryParams;
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
	name: '',
	uuid: '',
	rowData: null as BoxInfo | null,
	countdown: 3, // 倒计时改为3秒
});

// 解绑对话框状态
const unbindDialog = reactive({
	visible: false,
	uuid: '',
	userName: '',
	userId: 0,
	rowData: null as BoxInfo | null,
	countdown: 0,
});

// 绑定对话框状态
const bindDialog = reactive({
	visible: false,
	uuid: '',
	selectedUser: '',
	rowData: null as BoxInfo | null,
	currentUser: null as { name: string } | null, // 添加当前所属用户信息
	userList: [] as any[], // 添加用户列表
});

// 远程开箱对话框状态
const remoteOpenDialog = reactive({
	visible: false,
	uuid: '',
	rowData: null as BoxInfo | null,
});

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

// 箱体操作对话框状态
const boxDialog = reactive({
	visible: false,
	type: 'activate' as 'activate' | 'edit',
	form: {
		id: '',
		uuid: '',
		name: '',
		type: '',
		remarks: '',
	},
	rules: {
		name: [{ required: true, message: '请输入箱体名称', trigger: 'blur' }],
		type: [{ required: true, message: '请选择箱体类型', trigger: 'change' }],
	},
});

const boxFormRef = ref();

const { tableData } = toRefs(state);
// 初始化表格数据
const initTableData = () => {
	boxList();
};
const boxList = async () => {
	try {
		state.tableData.loading = true;
		const res = await getBoxListWithUser(state.tableData.param);
		if (res.code === 0) {
			state.tableData.data = res.data.list;
			state.tableData.total = res.data.total;
		} else {
			ElMessage.error(res.message || '获取箱体列表失败');
		}
	} catch (error) {
		console.error('获取箱体列表失败:', error);
		ElMessage.error('获取箱体列表失败');
	} finally {
		state.tableData.loading = false;
	}
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
const onGetLocation = async (row: BoxInfo) => {
	try {
		const res = await getBoxDetail(row.id);
		if (res.code === 0) {
			// 打开定位地图弹窗，传入最新的箱子信息
			locationMapRef.value?.openDialog(res.data, 'location');
		} else {
			ElMessage.error(res.message || '获取箱子详情失败');
		}
	} catch (error) {
		console.error('获取箱子详情失败:', error);
		ElMessage.error('获取箱子详情失败');
	}
};
// 查看轨迹记录
const onGetTrajectory = async (row: BoxInfo) => {
	try {
		const res = await getBoxDetail(row.id);
		if (res.code === 0) {
			// 打开轨迹地图弹窗，传入最新的箱子信息
			locationMapRef.value?.openDialog(res.data, 'track');
		} else {
			ElMessage.error(res.message || '获取箱子详情失败');
		}
	} catch (error) {
		console.error('获取箱子详情失败:', error);
		ElMessage.error('获取箱子详情失败');
	}
};
const activateFormRef = ref();

// 激活箱体
const onActivateBox = (row: BoxInfo) => {
	boxDialog.type = 'activate';
	boxDialog.visible = true;
	boxDialog.form.id = row.id;
	boxDialog.form.uuid = row.uuid;
	boxDialog.form.name = '';
	boxDialog.form.type = '';
	boxDialog.form.remarks = '';
};

// 编辑箱体
const onEditBox = (row: BoxInfo) => {
	boxDialog.type = 'edit';
	boxDialog.visible = true;
	boxDialog.form.id = row.id;
	boxDialog.form.uuid = row.uuid;
	boxDialog.form.name = row.name;
	boxDialog.form.type = row.type;
	boxDialog.form.remarks = row.remarks || '';
};

// 取消箱体操作
const cancelBoxDialog = () => {
	boxDialog.visible = false;
	boxDialog.form.id = '';
	boxDialog.form.uuid = '';
	boxDialog.form.name = '';
	boxDialog.form.type = '';
	boxDialog.form.remarks = '';
	boxFormRef.value?.resetFields();
};

// 确认箱体操作
const confirmBoxDialog = async () => {
	try {
		await boxFormRef.value?.validate();

		const params = {
			id: Number(boxDialog.form.id),
			name: boxDialog.form.name,
			type: Number(boxDialog.form.type),
			remarks: boxDialog.form.remarks,
		};

		const res = boxDialog.type === 'activate' ? await activateBox(params) : await updateBox(params);

		if (res.code === 0) {
			ElMessage.success(boxDialog.type === 'activate' ? '箱体激活成功' : '箱体修改成功');
			cancelBoxDialog();
			boxList();
		} else {
			ElMessage.error(res.message || (boxDialog.type === 'activate' ? '激活失败' : '修改失败'));
		}
	} catch (error: any) {
		console.error(boxDialog.type === 'activate' ? '激活箱体失败:' : '修改箱体失败:', error);
		ElMessage.error(error?.message || (boxDialog.type === 'activate' ? '激活失败' : '修改失败'));
	}
};
// 删除箱体
const onRowDel = (row: any) => {
	let ids: number[] = [];
	if (row) {
		ids = [Number(row.id)];
		showDeleteDialog(row);
	} else {
		ids = state.ids.map((id) => Number(id));
		if (ids.length === 0) {
			ElMessage.error('请选择要删除的数据。');
			return;
		}
		// 显示批量删除对话框
		deleteDialog.visible = true;
		// 获取所有选中箱体的名称
		const selectedNames = state.tableData.data
			.filter((item) => ids.includes(Number(item.id)))
			.map((item) => item.name || item.uuid)
			.join('、');
		deleteDialog.name = selectedNames;
		deleteDialog.rowData = { id: ids.join(',') } as any; // 将多个id用逗号连接存储
		deleteDialog.countdown = 10;

		// 开始倒计时
		const countdownTimer = setInterval(() => {
			deleteDialog.countdown--;
			if (deleteDialog.countdown <= 0) {
				clearInterval(countdownTimer);
			}
		}, 1000);
	}
};
// 页面加载时
onMounted(() => {
	initTableData();
});
// 多选框选中数据
const handleSelectionChange = (selection: Array<BoxInfo>) => {
	state.ids = selection.map((item) => Number(item.id));
};

// 处理更多操作
const handleMoreAction = (command: string, row: BoxInfo) => {
	if (command === 'activate') {
		onActivateBox(row);
	} else if (command === 'edit') {
		onEditBox(row);
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
const showDeleteDialog = (row: BoxInfo) => {
	deleteDialog.visible = true;
	deleteDialog.uuid = row.uuid;
	deleteDialog.name = row.name;
	deleteDialog.rowData = row;

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
	deleteDialog.uuid = '';
	deleteDialog.name = '';
	deleteDialog.rowData = null;
	deleteDialog.countdown = 3;
};

// 确认删除
const confirmDelete = async () => {
	try {
		const idStr = deleteDialog.rowData?.id?.toString() || '';
		const ids = idStr.includes(',')
			? idStr.split(',').map((id) => Number(id)) // 批量删除
			: [Number(idStr)]; // 单个删除

		const res = await deleteBox(ids);
		if (res.code === 0) {
			ElMessage.success('删除成功');
			cancelDelete();
			boxList();
		} else {
			ElMessage.error(res.message || '删除失败');
		}
	} catch (error) {
		console.error('删除箱体失败:', error);
		ElMessage.error('删除失败');
	}
};

// 绑定电子围栏
const onBindFence = (row: BoxInfo) => {
	ElMessage.info('绑定电子围栏功能开发中...');
};

// 显示解绑确认对话框
const showUnbindDialog = async (row: BoxInfo) => {
	if (!row.user_name) {
		ElMessage.warning('该箱体尚未绑定用户');
		return;
	}

	try {
		// 获取用户列表来找到用户ID
		const res = await getUserList({});
		if (res.code === 0) {
			const currentUser = res.data.userList.find((user: any) => user.userNickname === row.user_name);
			if (currentUser) {
				unbindDialog.visible = true;
				unbindDialog.uuid = row.uuid;
				unbindDialog.userName = row.user_name;
				unbindDialog.userId = currentUser.id;
				unbindDialog.rowData = row;
				unbindDialog.countdown = 3; // 3秒倒计时

				// 开始倒计时
				const countdownTimer = setInterval(() => {
					unbindDialog.countdown--;
					if (unbindDialog.countdown <= 0) {
						clearInterval(countdownTimer);
					}
				}, 1000);
			} else {
				ElMessage.error('未找到对应的用户信息');
			}
		} else {
			ElMessage.error(res.message || '获取用户信息失败');
		}
	} catch (error) {
		console.error('获取用户信息失败:', error);
		ElMessage.error('获取用户信息失败');
	}
};

// 取消解绑
const cancelUnbind = () => {
	unbindDialog.visible = false;
	unbindDialog.uuid = '';
	unbindDialog.userName = '';
	unbindDialog.userId = 0;
	unbindDialog.rowData = null;
	unbindDialog.countdown = 0;
};

// 确认解绑
const confirmUnbind = async () => {
	try {
		if (!unbindDialog.rowData) {
			ElMessage.error('箱体信息不存在');
			return;
		}

		const res = await unbindUserBox({
			userId: unbindDialog.userId,
			eboxId: Number(unbindDialog.rowData.id),
		});

		if (res.code === 0) {
			ElMessage.success('解绑成功');
			// 更新本地数据
			if (unbindDialog.rowData) {
				unbindDialog.rowData.user_name = undefined;
			}
			cancelUnbind();
			boxList();
		} else {
			ElMessage.error(res.message || '解绑失败');
		}
	} catch (error) {
		console.error('解绑失败:', error);
		ElMessage.error('解绑失败');
	}
};

// 显示绑定对话框
const showBindDialog = async (row: BoxInfo) => {
	bindDialog.visible = true;
	bindDialog.uuid = row.uuid;
	bindDialog.selectedUser = '';
	bindDialog.rowData = row;

	// 设置当前所属用户信息
	bindDialog.currentUser = row.user_name
		? {
				name: row.user_name,
			}
		: null;

	try {
		// 获取用户列表
		const res = await getUserList({});
		if (res.code === 0) {
			// 过滤掉当前所属用户
			bindDialog.userList = res.data.userList.filter((user: any) => !row.user_name || user.userNickname !== row.user_name);
		} else {
			ElMessage.error(res.message || '获取用户列表失败');
		}
	} catch (error) {
		console.error('获取用户列表失败:', error);
		ElMessage.error('获取用户列表失败');
	}
};

// 取消绑定
const cancelBind = () => {
	bindDialog.visible = false;
	bindDialog.uuid = '';
	bindDialog.selectedUser = '';
	bindDialog.rowData = null;
	bindDialog.currentUser = null;
	bindDialog.userList = [];
};

// 确认绑定
const confirmBind = async () => {
	if (!bindDialog.selectedUser) {
		ElMessage.error('请选择要绑定的用户');
		return;
	}

	try {
		// 调用绑定API
		const res = await bindUserBox({
			userId: Number(bindDialog.selectedUser),
			eboxId: Number(bindDialog.rowData?.id),
		});

		if (res.code === 0) {
			// 查找选中的用户信息
			const selectedUserInfo = bindDialog.userList.find((user) => user.id === bindDialog.selectedUser);
			if (selectedUserInfo && bindDialog.rowData) {
				// 更新箱体的用户信息
				bindDialog.rowData.user_name = selectedUserInfo.userNickname;
			}
			ElMessage.success('绑定成功');
			cancelBind();
			boxList();
		} else {
			ElMessage.error(res.message || '绑定失败');
		}
	} catch (error) {
		console.error('绑定失败:', error);
		ElMessage.error('绑定失败');
	}
};

// 显示远程开箱对话框
const showRemoteOpenDialog = (row: BoxInfo) => {
	remoteOpenDialog.visible = true;
	remoteOpenDialog.uuid = row.uuid;
	remoteOpenDialog.rowData = row;
};

// 取消远程开箱
const cancelRemoteOpen = () => {
	remoteOpenDialog.visible = false;
	remoteOpenDialog.uuid = '';
	remoteOpenDialog.rowData = null;
};

// 确认远程开箱
const confirmRemoteOpen = async () => {
	try {
		if (!remoteOpenDialog.rowData?.id) {
			ElMessage.error('箱体ID不存在');
			return;
		}

		const res = await unlockBox(Number(remoteOpenDialog.rowData.id));

		if (res.code === 0) {
			ElMessage.success('远程开箱指令已发送');
			// 更新锁状态
			if (remoteOpenDialog.rowData) {
				remoteOpenDialog.rowData.lock_stat = '0'; // 开锁
			}
			cancelRemoteOpen();
			boxList(); // 刷新列表
		} else {
			ElMessage.error(res.message || '远程开箱失败');
		}
	} catch (error) {
		console.error('远程开箱失败:', error);
		ElMessage.error('远程开箱失败');
	}
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

	// 当前用户信息样式
	.current-user-info,
	.no-user-info {
		padding: 5px 0;

		.el-tag {
			font-size: 14px;
		}
	}
}
</style>
