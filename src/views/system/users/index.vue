<template>
	<div class="system-user-container">
		<el-card shadow="hover">
			<div class="system-user-search mb15">
				<el-form :model="param" ref="queryRef" :inline="true" label-width="68px">
					<el-form-item label="部门" prop="deptId">
						<el-select v-model="param.deptId" placeholder="请选择部门" clearable style="width: 240px">
							<el-option v-for="item in deptData" :key="item.deptId" :label="item.deptName" :value="item.deptId" />
						</el-select>
					</el-form-item>
					<el-form-item label="性别" prop="gender">
						<el-select v-model="param.gender" placeholder="请选择性别" clearable style="width: 240px">
							<el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value" />
						</el-select>
					</el-form-item>
					<el-form-item label="权限" prop="permissions">
						<el-select v-model="param.permissions" placeholder="请选择权限" clearable style="width: 240px">
							<el-option label="管理员" value="admin" />
							<el-option label="操作员" value="operator" />
							<el-option label="普通用户" value="user" />
						</el-select>
					</el-form-item>
					<el-form-item label="任务状态" prop="taskStatus">
						<el-select v-model="param.taskStatus" placeholder="请选择任务状态" clearable style="width: 240px">
							<el-option label="任务中" :value="1" />
							<el-option label="空闲" :value="0" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button size="default" type="primary" class="ml10" @click="userList">
							<el-icon>
								<ele-Search />
							</el-icon>
							查询
						</el-button>
						<el-button size="default" @click="resetQuery(queryRef)">
							<el-icon>
								<ele-Refresh />
							</el-icon>
							重置
						</el-button>
					</el-form-item>
				</el-form>
			</div>

			<UserList ref="userListRef" :dept-data="deptData" :gender-data="sys_user_sex" :param="param" @getUserList="userList" />
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { toRefs, reactive, onMounted, ref, watch, getCurrentInstance } from 'vue';
import { ElTree, FormInstance } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import UserList from '/@/views/system/users/component/userList.vue';
import { getDeptTree } from '/@/api/system/users';

interface QueryParam {
	ids: number[];
	deptProps: {};
	deptData: any[];
	param: {
		deptId: string;
		gender: string;
		permissions: string;
		taskStatus: number | string;
	};
}
defineOptions({ name: 'systemUser' });
const { proxy } = <any>getCurrentInstance();
const { sys_user_sex } = proxy.useDict('sys_user_sex');
const userListRef = ref();
const queryRef = ref();
const filterText = ref('');
const treeRef = ref<InstanceType<typeof ElTree>>();
const search = Search;
const state = reactive<QueryParam>({
	ids: [],
	deptProps: {
		id: 'deptId',
		children: 'children',
		label: 'deptName',
	},
	deptData: [
		{
			label: '集团总部',
			children: [
				{
					label: '曲靖分部',
					children: [
						{
							label: '总经办',
						},
						{
							label: '市场部',
						},
						{
							label: '研发部',
						},
					],
				},
			],
		},
	],
	param: {
		deptId: '',
		gender: '',
		permissions: '',
		taskStatus: '',
	},
});
const { deptData, deptProps, param } = toRefs(state);
// 初始化表格数据
const initTableData = () => {
	getDeptTree(true).then((res: any) => {
		state.deptData = res.data.deps;
	});
};
const userList = () => {
	userListRef.value.userList();
};
// 打开新增用户弹窗
const onOpenAddUser = () => {
	userListRef.value.onOpenAddUser();
};
// 删除用户
const onRowDel = () => {
	userListRef.value.onRowDel(null);
};
// 页面加载时
onMounted(() => {
	initTableData();
});
watch(filterText, (val) => {
	treeRef.value!.filter(val);
});
const deptFilterNode = (value: string, data: any) => {
	if (!value) return true;
	return data.deptName.includes(value);
};
// 节点单击事件
const handleNodeClick = (data: any) => {
	state.param.deptId = data.deptId;
	userList();
};
/** 重置按钮操作 */
const resetQuery = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.resetFields();
	userList();
};
</script>
