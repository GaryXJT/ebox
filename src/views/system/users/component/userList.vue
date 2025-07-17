<template>
	<div class="system-user-container">
		<el-card shadow="hover">
			<div class="system-user-search mb15">
				<el-form :inline="true">
					<el-form-item label="用户搜索">
						<el-input v-model="tableData.param.keyWords" placeholder="请输入姓名/RFID/指纹码" class="w-50 m-2" clearable />
					</el-form-item>
					<el-form-item>
						<el-button size="default" type="primary" class="ml10" @click="userList">
							<el-icon>
								<ele-Search />
							</el-icon>
							查询
						</el-button>
					</el-form-item>
					<el-form-item class="right-button-item">
						<el-button size="default" type="danger" class="ml10" @click="onRowDel(null)">
							<el-icon>
								<ele-Delete />
							</el-icon>
							批量删除
						</el-button>
					</el-form-item>
				</el-form>
			</div>
			<el-table :data="tableData.data" style="width: 100%" @selection-change="handleSelectionChange">
				<el-table-column type="selection" width="55" align="center" fixed="left" sortable />
				<el-table-column prop="id" label="编号ID" width="80" fixed="left" sortable />
				<el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="deptName" label="部门" min-width="120" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="gender" label="性别" min-width="80" show-overflow-tooltip sortable></el-table-column>
				<el-table-column label="权限" align="center" prop="permissions" min-width="200" :show-overflow-tooltip="true" sortable>
					<template #default="scope">
						<el-tag v-for="(item, index) of scope.row.permissions" :key="'perm-' + index" class="ml5">{{ item }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="taskStatus" label="任务状态" min-width="100" show-overflow-tooltip sortable>
					<template #default="scope">
						<el-tag :type="scope.row.taskStatus === 1 ? 'warning' : 'info'">
							{{ scope.row.taskStatus === 1 ? '任务中' : '无任务' }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="rfidCard" label="RFID卡号" min-width="150" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="fingerprint" label="指纹码" min-width="150" show-overflow-tooltip sortable></el-table-column>
				<el-table-column prop="remarks" label="备注" min-width="200" show-overflow-tooltip></el-table-column>
				<el-table-column label="操作" width="200" fixed="right">
					<template #default="scope">
						<el-button size="small" text type="success" @click="onOpenUserBox(scope.row)">相关箱体</el-button>
						<el-button size="small" text type="primary" @click="onOpenEditUser(scope.row)">修改</el-button>
						<el-button size="small" text type="danger" @click="onRowDel(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
			<pagination
				v-show="tableData.total > 0"
				:total="tableData.total"
				v-model:page="tableData.param.pageNum"
				v-model:limit="tableData.param.pageSize"
				@pagination="userList"
				class="pagination-container"
			/>
		</el-card>
		<EditUser ref="editUserRef" :dept-data="deptData" :gender-data="genderData" @getUserList="userList" />
		<UserBoxList ref="userBoxListRef" />
	</div>
</template>

<script setup lang="ts">
import { toRefs, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import EditUser from '/@/views/system/users/component/editUser.vue';
import UserBoxList from '/@/views/system/users/component/userBoxList.vue';

// 定义接口来定义对象的类型
interface TableData {
	id: number;
	name: string;
	deptName: string;
	gender: string;
	permissions: string[];
	taskStatus: number;
	rfidCard: string;
	fingerprint: string;
	remarks: string;
	createdAt: string;
}

interface TableDataState {
	ids: number[];
	tableData: {
		data: Array<TableData>;
		total: number;
		loading: boolean;
		param: {
			keyWords: string;
			pageNum: number;
			pageSize: number;
		};
	};
}

defineOptions({ name: 'systemUserList' });

const props = defineProps({
	deptData: {
		type: Array,
		default: () => [],
	},
	param: {
		type: Object,
		default: () => {},
	},
	genderData: {
		type: Array,
		default: () => [],
	},
});

const editUserRef = ref();
const userBoxListRef = ref();
const state = reactive<TableDataState>({
	ids: [],
	tableData: {
		data: [],
		total: 0,
		loading: false,
		param: {
			keyWords: '',
			pageNum: 1,
			pageSize: 10,
		},
	},
});

const { tableData } = toRefs(state);

// 初始化表格数据
const initTableData = () => {
	userList();
};

const userList = () => {
	// 模拟数据
	const mockData = [
		{
			id: 1001,
			name: '张三',
			deptName: '生产部',
			gender: '男',
			permissions: ['操作员'],
			taskStatus: 1,
			rfidCard: 'RF001234',
			fingerprint: 'FP7890',
			remarks: '生产线A组组长',
			createdAt: '2024-01-15',
		},
		{
			id: 1002,
			name: '李四',
			deptName: '质检部',
			gender: '女',
			permissions: ['质检员', '操作员'],
			taskStatus: 0,
			rfidCard: 'RF001235',
			fingerprint: 'FP7891',
			remarks: '质检专员',
			createdAt: '2024-01-16',
		},
		{
			id: 1003,
			name: '王五',
			deptName: '研发部',
			gender: '男',
			permissions: ['工程师', '主管'],
			taskStatus: 1,
			rfidCard: 'RF001236',
			fingerprint: 'FP7892',
			remarks: '系统架构师',
			createdAt: '2024-01-17',
		},
		{
			id: 1004,
			name: '赵六',
			deptName: '工程部',
			gender: '男',
			permissions: ['工程师'],
			taskStatus: 0,
			rfidCard: 'RF001237',
			fingerprint: 'FP7893',
			remarks: '设备维护工程师',
			createdAt: '2024-01-18',
		},
		{
			id: 1005,
			name: '小红',
			deptName: '生产部',
			gender: '女',
			permissions: ['操作员'],
			taskStatus: 1,
			rfidCard: 'RF001238',
			fingerprint: 'FP7894',
			remarks: '生产线B组组员',
			createdAt: '2024-01-19',
		},
		{
			id: 1006,
			name: '小明',
			deptName: '研发部',
			gender: '男',
			permissions: ['工程师'],
			taskStatus: 0,
			rfidCard: 'RF001239',
			fingerprint: 'FP7895',
			remarks: '软件开发工程师',
			createdAt: '2024-01-20',
		},
		{
			id: 1007,
			name: '小华',
			deptName: '质检部',
			gender: '女',
			permissions: ['质检员'],
			taskStatus: 1,
			rfidCard: 'RF001240',
			fingerprint: 'FP7896',
			remarks: '产品质量检验员',
			createdAt: '2024-01-21',
		},
		{
			id: 1008,
			name: '小李',
			deptName: '工程部',
			gender: '男',
			permissions: ['工程师', '主管'],
			taskStatus: 0,
			rfidCard: 'RF001241',
			fingerprint: 'FP7897',
			remarks: '设备部主管',
			createdAt: '2024-01-22',
		},
	];

	// 根据搜索条件过滤数据
	let filteredData = mockData;
	if (state.tableData.param.keyWords) {
		const keywords = state.tableData.param.keyWords.toLowerCase();
		filteredData = mockData.filter(
			(item) =>
				item.name.toLowerCase().includes(keywords) ||
				item.rfidCard.toLowerCase().includes(keywords) ||
				item.fingerprint.toLowerCase().includes(keywords) ||
				item.remarks.toLowerCase().includes(keywords)
		);
	}

	// 模拟分页
	const pageSize = state.tableData.param.pageSize;
	const pageNum = state.tableData.param.pageNum;
	const startIndex = (pageNum - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	state.tableData.data = filteredData.slice(startIndex, endIndex);
	state.tableData.total = filteredData.length;
};

// 打开新增用户弹窗
const onOpenAddUser = () => {
	editUserRef.value.openDialog();
};

// 打开修改用户弹窗
const onOpenEditUser = (row: TableData) => {
	editUserRef.value.openDialog(row);
};

// 删除用户
const onRowDel = (row: TableData | null) => {
	let msg = '你确定要删除所选用户？';
	let ids: number[] = [];
	if (row) {
		msg = `此操作将永久删除用户："${row.name}"，是否继续?`;
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
			ElMessage.success('删除成功');
			userList();
		})
		.catch(() => {});
};

// 打开用户关联箱体弹窗
const onOpenUserBox = (row: TableData) => {
	userBoxListRef.value.openDialog(row.id);
};

// 页面加载时
onMounted(() => {
	initTableData();
});

// 多选框选中数据
const handleSelectionChange = (selection: Array<TableData>) => {
	state.ids = selection.map((item) => item.id);
};

defineExpose({ userList, onOpenAddUser, onRowDel });
</script>

<style scoped lang="scss">
.system-user-container {
	.ml5 {
		margin-left: 5px;
	}
	.right-button-item {
		margin-left: auto;
	}
	.system-user-search {
		.el-form {
			display: flex;
			align-items: center;
			.el-form-item {
				margin-bottom: 0;
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
