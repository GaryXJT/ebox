<template>
	<div class="system-monitor-container">
		<el-card shadow="hover">
			<el-tabs v-model="activeTab" @tab-click="handleTabClick">
				<el-tab-pane label="操作日志" name="operation">
					<operation-table v-if="activeTab === 'operation'" />
				</el-tab-pane>
				<el-tab-pane label="登录日志" name="login">
					<login-table v-if="activeTab === 'login'" />
				</el-tab-pane>
				<el-tab-pane label="系统状态" name="system">
					<system-table v-if="activeTab === 'system'" />
				</el-tab-pane>
				<el-tab-pane label="在线用户" name="online">
					<online-table v-if="activeTab === 'online'" />
				</el-tab-pane>
			</el-tabs>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import OperationTable from './components/OperationTable.vue';
import LoginTable from './components/LoginTable.vue';
import SystemTable from './components/SystemTable.vue';
import OnlineTable from './components/OnlineTable.vue';

defineOptions({ name: 'SystemMonitor' });

// 当前激活的 tab
const activeTab = ref('operation');

// 处理 tab 切换
const handleTabClick = () => {
	// 可以在这里处理 tab 切换的逻辑
};
</script>

<style lang="scss" scoped>
.system-monitor-container {
	:deep(.el-tabs__content) {
		padding: 20px 0;
	}
}
</style>
