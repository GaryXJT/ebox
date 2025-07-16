<template>
	<div class="system-edit-box-container">
		<el-dialog v-model="isShowDialog" width="769px">
			<template #header>
				<div v-drag="['.system-edit-box-container .el-dialog', '.system-edit-box-container .el-dialog__header']">
					{{ (formData.id === 0 ? '添加' : '修改') + '箱体' }}
				</div>
			</template>
			<el-form ref="formRef" :model="formData" :rules="rules" size="default" label-width="90px">
				<el-form-item label="箱体编号" prop="boxId">
					<el-input v-model="formData.boxId" placeholder="请输入箱体编号" />
				</el-form-item>
				<el-form-item label="规格" prop="specification">
					<el-select v-model="formData.specification" placeholder="请选择规格" style="width: 100%">
						<el-option label="手提箱" value="suitcase" />
						<el-option label="拉杆箱" value="trolley" />
					</el-select>
				</el-form-item>
				<el-form-item label="绑定状态" prop="bindingStatus">
					<el-switch
						v-model="formData.bindingStatus"
						:active-value="true"
						:inactive-value="false"
						inline-prompt
						active-text="是"
						inactive-text="否"
					></el-switch>
				</el-form-item>
				<el-form-item label="任务状态" prop="taskStatus">
					<el-select v-model="formData.taskStatus" placeholder="请选择任务状态" style="width: 100%">
						<el-option label="任务中" value="running" />
						<el-option label="无" value="idle" />
					</el-select>
				</el-form-item>
				<el-form-item label="开盖状态" prop="coverStatus">
					<el-select v-model="formData.coverStatus" placeholder="请选择开盖状态" style="width: 100%">
						<el-option label="开" value="open" />
						<el-option label="关" value="closed" />
					</el-select>
				</el-form-item>
				<el-form-item label="健康状态" prop="healthStatus">
					<el-select v-model="formData.healthStatus" placeholder="请选择健康状态" style="width: 100%">
						<el-option label="健康" value="healthy" />
						<el-option label="异常" value="abnormal" />
					</el-select>
				</el-form-item>
				<el-form-item label="电子围栏状态" prop="fenceStatus">
					<el-select v-model="formData.fenceStatus" placeholder="请选择电子围栏状态" style="width: 100%">
						<el-option label="正常" value="normal" />
						<el-option label="警告" value="warning" />
					</el-select>
				</el-form-item>
				<el-form-item label="电量状态" prop="batteryLevel">
					<el-input-number v-model="formData.batteryLevel" controls-position="right" :min="0" :max="100" />
					<span style="margin-left: 10px">%</span>
				</el-form-item>
				<el-form-item label="备注" prop="remark">
					<el-input v-model="formData.remark" type="textarea" placeholder="请输入内容" />
				</el-form-item>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" size="default" :loading="loading">{{ formData.id === 0 ? '新 增' : '修 改' }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { reactive, toRefs, defineComponent, ref, unref } from 'vue';
import { addBox, editBox } from '/@/api/system/box';
import { ElMessage } from 'element-plus';

interface DialogRow {
	id: number;
	boxId: string;
	specification: string;
	bindingStatus: boolean;
	taskStatus: string;
	coverStatus: string;
	healthStatus: string;
	fenceStatus: string;
	batteryLevel: number;
	remark: string;
}
interface BoxState {
	loading: boolean;
	isShowDialog: boolean;
	formData: DialogRow;
	rules: object;
}
defineOptions({ name: 'systemEditBox' });
const emit = defineEmits(['getBoxList']);
const formRef = ref<HTMLElement | null>(null);
const state = reactive<BoxState>({
	loading: false,
	isShowDialog: false,
	formData: {
		id: 0,
		boxId: '',
		specification: 'suitcase',
		bindingStatus: false,
		taskStatus: 'idle',
		coverStatus: 'closed',
		healthStatus: 'healthy',
		fenceStatus: 'normal',
		batteryLevel: 100,
		remark: '',
	},
	// 表单校验
	rules: {
		boxId: [{ required: true, message: '箱体编号不能为空', trigger: 'blur' }],
		specification: [{ required: true, message: '规格不能为空', trigger: 'blur' }],
		batteryLevel: [{ required: true, message: '电量状态不能为空', trigger: 'blur' }],
	},
});
const { isShowDialog, formData, loading, rules } = toRefs(state);
// 打开弹窗
const openDialog = (row?: DialogRow) => {
	resetForm();
	if (row) {
		state.formData = row;
	}
	state.isShowDialog = true;
};
defineExpose({ openDialog });
// 关闭弹窗
const closeDialog = () => {
	state.isShowDialog = false;
};
// 取消
const onCancel = () => {
	closeDialog();
};
// 新增
const onSubmit = () => {
	const formWrap = unref(formRef) as any;
	if (!formWrap) return;
	formWrap.validate((valid: boolean) => {
		if (valid) {
			state.loading = true;
			if (state.formData.id === 0) {
				//添加
				addBox(state.formData)
					.then(() => {
						ElMessage.success('箱体添加成功');
						closeDialog(); // 关闭弹窗
						emit('getBoxList');
					})
					.finally(() => {
						state.loading = false;
					});
			} else {
				//修改
				editBox(state.formData)
					.then(() => {
						ElMessage.success('箱体修改成功');
						closeDialog(); // 关闭弹窗
						emit('getBoxList');
					})
					.finally(() => {
						state.loading = false;
					});
			}
		}
	});
};
const resetForm = () => {
	state.formData = {
		id: 0,
		boxId: '',
		specification: 'suitcase',
		bindingStatus: false,
		taskStatus: 'idle',
		coverStatus: 'closed',
		healthStatus: 'healthy',
		fenceStatus: 'normal',
		batteryLevel: 100,
		remark: '',
	};
};
</script>

<style scoped lang="scss">
.tree-border {
	margin-top: 5px;
	border: 1px solid #e5e6e7 !important;
	background: #fff none !important;
	border-radius: 4px;
}
.system-edit-box-container {
	.menu-data-tree {
		border: var(--el-input-border, var(--el-border-base));
		border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
		padding: 5px;
	}
}
</style>
