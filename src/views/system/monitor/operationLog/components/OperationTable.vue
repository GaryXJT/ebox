<template>
	<div class="operation-table">
		<div class="table-header mb15">
			<el-form :model="tableData.param" ref="queryRef" :inline="true" label-width="100px">
				<el-form-item label="系统模块" prop="title">
					<el-input v-model="tableData.param.title" placeholder="请输入系统模块" clearable @keyup.enter.native="loadData" />
				</el-form-item>
				<el-form-item label="请求方式" prop="requestMethod">
					<el-select v-model="tableData.param.requestMethod" placeholder="请选择请求方式" clearable style="width: 160px">
						<el-option v-for="dict in sys_oper_log_type" :key="dict.value" :label="dict.label" :value="dict.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="操作人员" prop="operName">
					<el-input v-model="tableData.param.operName" placeholder="请输入操作人员" clearable @keyup.enter.native="loadData" />
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
				<el-button type="danger" :disabled="multiple" @click="handleDelete(null)" v-auth="'api/v1/system/sysOperLog/delete'">
					<el-icon><ele-Delete /></el-icon>删除
				</el-button>
				<el-button type="danger" @click="onRowClear">
					<el-icon><ele-Delete /></el-icon>清空日志
				</el-button>
			</div>
		</div>

		<el-table v-loading="loading" :data="tableData.data" @selection-change="handleSelectionChange">
			<el-table-column type="selection" width="55" align="center" />
			<el-table-column label="日志编号" prop="operId" min-width="100px" align="center" />
			<el-table-column label="系统模块" prop="title" min-width="100px" align="center" />
			<el-table-column label="请求方式" prop="requestMethod" min-width="100px" align="center" :formatter="requestMethodFormat" />
			<el-table-column label="操作人员" prop="operName" min-width="100px" align="center" />
			<el-table-column label="部门名称" prop="deptName" min-width="100px" align="center" />
			<el-table-column label="请求URL" prop="operUrl" min-width="100px" align="center" :show-overflow-tooltip="true" />
			<el-table-column label="主机地址" prop="operIp" min-width="100px" align="center" />
			<el-table-column label="操作地点" prop="operLocation" min-width="100px" align="center" />
			<el-table-column label="操作时间" prop="operTime" min-width="120px" align="center">
				<template #default="scope">
					<span>{{ proxy.parseTime(scope.row.operTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" align="center" width="120" fixed="right">
				<template #default="scope">
					<el-button type="primary" link @click="handleView(scope.row)" v-auth="'api/v1/system/sysOperLog/view'">详情</el-button>
					<el-button type="primary" link @click="handleDelete(scope.row)" v-auth="'api/v1/system/sysOperLog/delete'">删除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<pagination
			v-show="tableData.total > 0"
			:total="tableData.total"
			v-model:page="tableData.param.pageNum"
			v-model:limit="tableData.param.pageSize"
			@pagination="loadData"
		/>

		<detail-dialog ref="detailRef" :requestMethodOptions="sys_oper_log_type" :deptNameOptions="deptNameOptions" @refresh="loadData" />
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { listSysOperLog, delSysOperLog, clearOperLog } from '/@/api/system/monitor/operLog';
import DetailDialog from '../component/detail.vue';
import type { SysOperLogTableColumns, SysOperLogInfoData } from '../component/model';

defineOptions({ name: 'OperationTable' });

const { proxy } = <any>getCurrentInstance();
const { sys_oper_log_type } = proxy.useDict('sys_oper_log_type');

const loading = ref(false);
const queryRef = ref<FormInstance>();
const detailRef = ref();
const multiple = ref(true);
const deptNameOptions = ref([]);

// 表格数据
const tableData = reactive({
	data: [],
	total: 0,
	param: {
		pageNum: 1,
		pageSize: 10,
		title: '',
		requestMethod: '',
		operName: '',
	},
});

// 加载数据
const loadData = async () => {
	loading.value = true;
	try {
		const res = await listSysOperLog(tableData.param);
		tableData.data = res.data.list || [];
		tableData.total = res.data.total;
	} finally {
		loading.value = false;
	}
};

// 重置查询
const resetQuery = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.resetFields();
	loadData();
};

// 请求方式格式化
const requestMethodFormat = (row: SysOperLogTableColumns) => {
	return proxy.selectDictLabel(sys_oper_log_type.value, row.requestMethod);
};

// 选择变化
const handleSelectionChange = (selection: Array<SysOperLogInfoData>) => {
	multiple.value = !selection.length;
};

// 查看详情
const handleView = (row: SysOperLogTableColumns) => {
	detailRef.value.openDialog(row);
};

// 删除操作
const handleDelete = async (row: SysOperLogTableColumns | null) => {
	const ids = row ? [row.operId] : [];
	if (!row && !ids.length) {
		ElMessage.error('请选择要删除的数据');
		return;
	}

	try {
		await ElMessageBox.confirm(row ? '此操作将永久删除该数据，是否继续？' : '确定要删除选中的数据吗？', '提示', {
			type: 'warning',
		});
		await delSysOperLog(ids);
		ElMessage.success('删除成功');
		loadData();
	} catch (error) {
		// 用户取消操作
	}
};

// 清空日志
const onRowClear = async () => {
	try {
		await ElMessageBox.confirm('确定要清空所有日志吗？', '提示', {
			type: 'warning',
		});
		await clearOperLog();
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
.operation-table {
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
