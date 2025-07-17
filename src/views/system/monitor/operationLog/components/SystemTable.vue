<template>
	<div class="system-table">
		<el-row :gutter="20">
			<el-col :span="12">
				<el-card shadow="hover" class="mb20">
					<template #header>
						<div class="card-header">
							<span>CPU使用率</span>
							<el-tag type="success">{{ systemInfo.cpu.usage }}%</el-tag>
						</div>
					</template>
					<div class="detail-list">
						<div class="detail-item">
							<span class="label">核心数：</span>
							<span class="value">{{ systemInfo.cpu.count }}</span>
						</div>
						<div class="detail-item">
							<span class="label">用户使用率：</span>
							<span class="value">{{ systemInfo.cpu.sys }}%</span>
						</div>
						<div class="detail-item">
							<span class="label">系统使用率：</span>
							<span class="value">{{ systemInfo.cpu.used }}%</span>
						</div>
						<div class="detail-item">
							<span class="label">当前空闲率：</span>
							<span class="value">{{ systemInfo.cpu.free }}%</span>
						</div>
					</div>
				</el-card>
			</el-col>

			<el-col :span="12">
				<el-card shadow="hover" class="mb20">
					<template #header>
						<div class="card-header">
							<span>内存使用率</span>
							<el-tag type="warning">{{ systemInfo.mem.usage }}%</el-tag>
						</div>
					</template>
					<div class="detail-list">
						<div class="detail-item">
							<span class="label">总内存：</span>
							<span class="value">{{ systemInfo.mem.total }}GB</span>
						</div>
						<div class="detail-item">
							<span class="label">已用内存：</span>
							<span class="value">{{ systemInfo.mem.used }}GB</span>
						</div>
						<div class="detail-item">
							<span class="label">剩余内存：</span>
							<span class="value">{{ systemInfo.mem.free }}GB</span>
						</div>
						<div class="detail-item">
							<span class="label">使用率：</span>
							<span class="value">{{ systemInfo.mem.usage }}%</span>
						</div>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="hover">
			<template #header>
				<div class="card-header">
					<span>服务器信息</span>
					<el-button type="primary" link @click="refreshData">
						<el-icon><ele-Refresh /></el-icon>刷新
					</el-button>
				</div>
			</template>
			<el-descriptions :column="2" border>
				<el-descriptions-item label="服务器名称">{{ systemInfo.server.name }}</el-descriptions-item>
				<el-descriptions-item label="操作系统">{{ systemInfo.server.os }}</el-descriptions-item>
				<el-descriptions-item label="服务器IP">{{ systemInfo.server.ip }}</el-descriptions-item>
				<el-descriptions-item label="系统架构">{{ systemInfo.server.arch }}</el-descriptions-item>
				<el-descriptions-item label="项目路径">{{ systemInfo.server.projectPath }}</el-descriptions-item>
				<el-descriptions-item label="运行时长">{{ systemInfo.server.runtime }}</el-descriptions-item>
			</el-descriptions>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineOptions({ name: 'SystemTable' });

// 模拟系统信息数据
const systemInfo = ref({
	cpu: {
		count: 8,
		usage: 45,
		sys: 30,
		used: 15,
		free: 55,
	},
	mem: {
		total: 16,
		used: 8.5,
		free: 7.5,
		usage: 53,
	},
	server: {
		name: 'Production Server',
		os: 'CentOS 7.9',
		ip: '192.168.1.100',
		arch: 'x86_64',
		projectPath: '/usr/local/app',
		runtime: '10天 23小时 45分钟',
	},
});

// 刷新数据
const refreshData = () => {
	// 这里应该调用实际的API获取最新系统状态
	// 暂时使用随机数模拟数据变化
	systemInfo.value.cpu.usage = Math.floor(Math.random() * 100);
	systemInfo.value.mem.usage = Math.floor(Math.random() * 100);
};

onMounted(() => {
	refreshData();
});
</script>

<style lang="scss" scoped>
.system-table {
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-list {
		.detail-item {
			display: flex;
			justify-content: space-between;
			margin-bottom: 10px;

			.label {
				color: #606266;
			}

			.value {
				color: #303133;
				font-weight: 500;
			}
		}
	}

	.mb20 {
		margin-bottom: 20px;
	}
}
</style>
