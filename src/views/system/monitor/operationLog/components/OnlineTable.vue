<template>
	<div class="online-table">
		<div class="table-header mb15">
			<el-form :model="queryParams" ref="queryRef" :inline="true" label-width="100px">
				<el-form-item label="用户账号" prop="userName">
					<el-input v-model="queryParams.userName" placeholder="请输入用户账号" clearable @keyup.enter.native="loadData" />
				</el-form-item>
				<el-form-item label="登录IP" prop="ipaddr">
					<el-input v-model="queryParams.ipaddr" placeholder="请输入登录IP" clearable @keyup.enter.native="loadData" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="loadData">
						<el-icon><ele-Search /></el-icon>查询
					</el-button>
					<el-button @click="resetQuery">
						<el-icon><ele-Refresh /></el-icon>重置
					</el-button>
				</el-form-item>
			</el-form>

			<div class="table-operations">
				<el-button type="danger" :disabled="!selectedIds.length" @click="handleForceLogout">
					<el-icon><ele-CircleClose /></el-icon>强制退出
				</el-button>
			</div>
		</div>

		<el-table v-loading="loading" :data="tableData" @selection-change="handleSelectionChange">
			<el-table-column type="selection" width="55" align="center" />
			<el-table-column label="会话编号" prop="tokenId" min-width="100" align="center" show-overflow-tooltip />
			<el-table-column label="用户账号" prop="userName" min-width="100" align="center" />
			<el-table-column label="部门" prop="deptName" min-width="100" align="center" />
			<el-table-column label="主机" prop="ipaddr" min-width="130" align="center" show-overflow-tooltip />
			<el-table-column label="登录地点" prop="loginLocation" min-width="130" align="center" show-overflow-tooltip />
			<el-table-column label="浏览器" prop="browser" min-width="100" align="center" show-overflow-tooltip />
			<el-table-column label="操作系统" prop="os" min-width="100" align="center" show-overflow-tooltip />
			<el-table-column label="登录时间" align="center" prop="loginTime" min-width="180">
				<template #default="scope">
					<span>{{ proxy.parseTime(scope.row.loginTime) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center" width="100" fixed="right">
				<template #default="scope">
					<el-button type="primary" link @click="handleForceLogout([scope.row.tokenId])">强退</el-button>
				</template>
			</el-table-column>
		</el-table>

		<pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="loadData" />
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';

defineOptions({ name: 'OnlineTable' });

const { proxy } = <any>getCurrentInstance();
const loading = ref(false);
const total = ref(0);
const queryRef = ref<FormInstance>();
const selectedIds = ref<string[]>([]);

// 查询参数
const queryParams = reactive({
	pageNum: 1,
	pageSize: 10,
	userName: '',
	ipaddr: '',
});

// 模拟数据
const tableData = ref([
	{
		tokenId: 'abc-123',
		userName: 'admin',
		deptName: '研发部',
		ipaddr: '192.168.1.1',
		loginLocation: '中国|浙江省|杭州市',
		browser: 'Chrome',
		os: 'Windows 10',
		loginTime: '2024-01-20 10:30:00',
	},
	{
		tokenId: 'def-456',
		userName: 'test',
		deptName: '市场部',
		ipaddr: '192.168.1.2',
		loginLocation: '中国|广东省|深圳市',
		browser: 'Firefox',
		os: 'MacOS',
		loginTime: '2024-01-20 11:15:00',
	},
]);

// 加载数据
const loadData = () => {
	loading.value = true;
	// 这里应该调用实际的API
	setTimeout(() => {
		total.value = 2;
		loading.value = false;
	}, 500);
};

// 重置查询
const resetQuery = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.resetFields();
	loadData();
};

// 选择变化
const handleSelectionChange = (selection: any[]) => {
	selectedIds.value = selection.map((item) => item.tokenId);
};

// 强制退出
const handleForceLogout = async (ids?: string[]) => {
	const tokenIds = ids || selectedIds.value;
	if (!tokenIds.length) {
		ElMessage.warning('请选择要强制退出的用户');
		return;
	}

	try {
		await ElMessageBox.confirm('确定要强制选中的用户退出吗？', '提示', {
			type: 'warning',
		});
		// 这里应该调用实际的API
		ElMessage.success('操作成功');
		loadData();
	} catch (error) {
		// 用户取消操作
	}
};

onMounted(() => {
	loadData();
});
</script>

<style lang="scss" scoped>
.online-table {
	.table-header {
		.el-form {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}
	}

	.table-operations {
		margin: 10px 0;
		display: flex;
		gap: 10px;
	}
}
</style>
