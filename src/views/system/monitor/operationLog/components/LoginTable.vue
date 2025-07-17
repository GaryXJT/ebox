<template>
	<div class="login-table">
		<div class="table-header mb15">
			<el-form :model="queryParams" ref="queryRef" :inline="true" label-width="100px">
				<el-form-item label="登录账号" prop="userName">
					<el-input v-model="queryParams.userName" placeholder="请输入登录账号" clearable @keyup.enter.native="loadData" />
				</el-form-item>
				<el-form-item label="登录状态" prop="status">
					<el-select v-model="queryParams.status" placeholder="请选择登录状态" clearable>
						<el-option label="成功" value="success" />
						<el-option label="失败" value="fail" />
					</el-select>
				</el-form-item>
				<el-form-item label="登录时间" prop="loginTime">
					<el-date-picker
						v-model="queryParams.loginTime"
						type="daterange"
						range-separator="-"
						start-placeholder="开始日期"
						end-placeholder="结束日期"
						value-format="YYYY-MM-DD"
					/>
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
				<el-button type="danger" @click="handleClear">
					<el-icon><ele-Delete /></el-icon>清空日志
				</el-button>
			</div>
		</div>

		<el-table v-loading="loading" :data="tableData">
			<el-table-column type="selection" width="55" align="center" />
			<el-table-column label="访问编号" prop="infoId" width="100" align="center" />
			<el-table-column label="用户名称" prop="userName" min-width="100" align="center" />
			<el-table-column label="登录地址" prop="ipaddr" min-width="130" align="center" :show-overflow-tooltip="true" />
			<el-table-column label="登录地点" prop="loginLocation" min-width="130" align="center" :show-overflow-tooltip="true" />
			<el-table-column label="浏览器" prop="browser" min-width="100" align="center" :show-overflow-tooltip="true" />
			<el-table-column label="操作系统" prop="os" min-width="100" align="center" :show-overflow-tooltip="true" />
			<el-table-column label="登录状态" align="center" min-width="100">
				<template #default="scope">
					<el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
						{{ scope.row.status === 'success' ? '成功' : '失败' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="登录时间" align="center" prop="loginTime" min-width="180">
				<template #default="scope">
					<span>{{ proxy.parseTime(scope.row.loginTime) }}</span>
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

defineOptions({ name: 'LoginTable' });

const { proxy } = <any>getCurrentInstance();
const loading = ref(false);
const total = ref(0);
const queryRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive({
	pageNum: 1,
	pageSize: 10,
	userName: '',
	status: '',
	loginTime: [],
});

// 模拟数据
const tableData = ref([
	{
		infoId: '1',
		userName: 'admin',
		ipaddr: '192.168.1.1',
		loginLocation: '中国|浙江省|杭州市',
		browser: 'Chrome',
		os: 'Windows 10',
		status: 'success',
		loginTime: '2024-01-20 10:30:00',
	},
	{
		infoId: '2',
		userName: 'test',
		ipaddr: '192.168.1.2',
		loginLocation: '中国|广东省|深圳市',
		browser: 'Firefox',
		os: 'MacOS',
		status: 'fail',
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

// 清空日志
const handleClear = async () => {
	try {
		await ElMessageBox.confirm('确定要清空所有登录日志吗？', '提示', {
			type: 'warning',
		});
		ElMessage.success('清空成功');
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
.login-table {
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
