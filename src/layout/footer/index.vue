<template>
  <div class="layout-footer mt15" v-show="isDelayFooter">
    <div class="layout-footer-warp">
      <div>Copyright © 2021-2023 g-fast.cn All Rights Reserved.</div>
      <div class="mt5">云南奇讯科技有限公司版权所有</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {onBeforeRouteUpdate} from 'vue-router';
defineOptions({ name: "layoutFooter"})
const isDelayFooter = ref(true)
// 路由改变时，等主界面动画加载完毕再显示 footer
onBeforeRouteUpdate(() => {
  setTimeout(() => {
    isDelayFooter.value = false;
    setTimeout(() => {
      isDelayFooter.value = true;
    }, 800);
  }, 0);
});
</script>

<style scoped lang="scss">
.layout-footer {
	width: 100%;
	display: flex;
	&-warp {
		margin: auto;
		color: var(--el-text-color-secondary);
		text-align: center;
		animation: error-num 1s ease-in-out;
	}
}
</style>
