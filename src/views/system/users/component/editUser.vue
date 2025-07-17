<template>
	<div class="system-edit-user-container">
		<el-dialog :title="(ruleForm.id !== 0 ? '修改' : '添加') + '用户'" v-model="isShowDialog" width="769px">
			<el-form ref="formRef" :model="ruleForm" :rules="rules" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="姓名" prop="name">
							<el-input v-model="ruleForm.name" placeholder="请输入姓名" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="部门" prop="deptName">
							<el-select v-model="ruleForm.deptName" placeholder="请选择部门" clearable class="w100">
								<el-option label="生产部" value="生产部"></el-option>
								<el-option label="质检部" value="质检部"></el-option>
								<el-option label="研发部" value="研发部"></el-option>
								<el-option label="工程部" value="工程部"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="性别" prop="gender">
							<el-select v-model="ruleForm.gender" placeholder="请选择性别" clearable class="w100">
								<el-option label="男" value="男"></el-option>
								<el-option label="女" value="女"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="权限" prop="permissions">
							<el-select v-model="ruleForm.permissions" placeholder="请选择权限" clearable class="w100" multiple>
								<el-option label="操作员" value="操作员"></el-option>
								<el-option label="质检员" value="质检员"></el-option>
								<el-option label="工程师" value="工程师"></el-option>
								<el-option label="主管" value="主管"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="任务状态" prop="taskStatus">
							<el-select v-model="ruleForm.taskStatus" placeholder="请选择状态" clearable class="w100">
								<el-option :label="'任务中'" :value="1"></el-option>
								<el-option :label="'无任务'" :value="0"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="RFID卡号" prop="rfidCard">
							<el-input v-model="ruleForm.rfidCard" placeholder="请输入RFID卡号" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
						<el-form-item label="指纹码" prop="fingerprint">
							<el-input v-model="ruleForm.fingerprint" placeholder="请输入指纹码" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
						<el-form-item label="备注">
							<el-input v-model="ruleForm.remarks" type="textarea" placeholder="请输入备注" maxlength="150"></el-input>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" size="default">{{ ruleForm.id !== 0 ? '修 改' : '添 加' }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { reactive, toRefs, ref, unref } from 'vue';
import { ElMessage } from 'element-plus';

// 定义接口来定义对象的类型
interface RuleForm {
	id: number;
	name: string;
	deptName: string;
	gender: string;
	permissions: string[];
	taskStatus: number;
	rfidCard: string;
	fingerprint: string;
	remarks: string;
}

defineOptions({ name: 'systemEditUser' });

const emit = defineEmits(['getUserList']);
const formRef = ref();

const state = reactive({
	isShowDialog: false,
	ruleForm: {
		id: 0,
		name: '',
		deptName: '',
		gender: '',
		permissions: [],
		taskStatus: 0,
		rfidCard: '',
		fingerprint: '',
		remarks: '',
	} as RuleForm,
	rules: {
		name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
		deptName: [{ required: true, message: '请选择部门', trigger: 'change' }],
		gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
		permissions: [{ required: true, message: '请选择权限', trigger: 'change' }],
		rfidCard: [{ required: true, message: '请输入RFID卡号', trigger: 'blur' }],
		fingerprint: [{ required: true, message: '请输入指纹码', trigger: 'blur' }],
	},
});

const { ruleForm, isShowDialog, rules } = toRefs(state);

// 打开弹窗
const openDialog = (row?: any) => {
	resetForm();
	if (row) {
		state.ruleForm = {
			id: row.id,
			name: row.name,
			deptName: row.deptName,
			gender: row.gender,
			permissions: row.permissions,
			taskStatus: row.taskStatus,
			rfidCard: row.rfidCard,
			fingerprint: row.fingerprint,
			remarks: row.remarks,
		};
	}
	state.isShowDialog = true;
};

// 关闭弹窗
const closeDialog = () => {
	state.isShowDialog = false;
};

// 取消
const onCancel = () => {
	closeDialog();
};

// 提交
const onSubmit = () => {
	const formWrap = unref(formRef) as any;
	if (!formWrap) return;
	formWrap.validate((valid: boolean) => {
		if (valid) {
			// 这里模拟提交成功
			ElMessage.success(state.ruleForm.id === 0 ? '添加成功' : '修改成功');
			closeDialog();
			emit('getUserList');
		}
	});
};

// 重置表单
const resetForm = () => {
	state.ruleForm = {
		id: 0,
		name: '',
		deptName: '',
		gender: '',
		permissions: [],
		taskStatus: 0,
		rfidCard: '',
		fingerprint: '',
		remarks: '',
	};
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.w100 {
	width: 100%;
}
.dialog-footer {
	padding-right: 20px;
	text-align: right;
}
</style>
