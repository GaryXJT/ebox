<template>
	<div v-if="isShowBreadcrumb" class="layout-navbars-breadcrumb">
		<SvgIcon
			class="layout-navbars-breadcrumb-icon"
			:name="themeConfig.isCollapse ? 'ele-Expand' : 'ele-Fold'"
			:size="16"
			@click="onThemeConfigChange"
		/>
		<el-breadcrumb class="layout-navbars-breadcrumb-hide">
			<transition-group name="breadcrumb">
				<el-breadcrumb-item v-for="(v, k) in breadcrumbList" :key="v.path">
					<span v-if="k === breadcrumbList.length - 1" class="layout-navbars-breadcrumb-span">
						<SvgIcon :name="v.meta.icon" class="layout-navbars-breadcrumb-iconfont" v-if="themeConfig.isBreadcrumbIcon" />
						<div v-if="!v.meta.tagsViewName">{{ $t(v.meta.title) }}</div>
						<div v-else>{{ v.meta.tagsViewName }}</div>
					</span>
					<a v-else @click.prevent="onBreadcrumbClick(v)">
						<SvgIcon :name="v.meta.icon" class="layout-navbars-breadcrumb-iconfont" v-if="themeConfig.isBreadcrumbIcon" />{{ $t(v.meta.title) }}
					</a>
				</el-breadcrumb-item>
			</transition-group>
		</el-breadcrumb>
	</div>
</template>

<script setup lang="ts">
import { toRefs, reactive, computed, onMounted } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { Local } from '/@/utils/storage';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { useRoutesList } from '/@/stores/routesList';
// 定义接口来定义对象的类型
interface BreadcrumbState {
	breadcrumbList: Array<any>;
	routeSplit: Array<string>;
	routeSplitFirst: string;
	routeSplitIndex: number;
}

defineOptions({ name: "layoutBreadcrumb"})
const stores = useRoutesList();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const { routesList } = storeToRefs(stores);
const route = useRoute();
const router = useRouter();
const state = reactive<BreadcrumbState>({
  breadcrumbList: [],
  routeSplit: [],
  routeSplitFirst: '',
  routeSplitIndex: 1,
});
const {breadcrumbList}= toRefs(state);
// 动态设置经典、横向布局不显示
const isShowBreadcrumb = computed(() => {
  initRouteSplit(route.path);
  const { layout, isBreadcrumb } = themeConfig.value;
  if (layout === 'classic' || layout === 'transverse') return false;
  else return isBreadcrumb ? true : false;
});
// 面包屑点击时
const onBreadcrumbClick = (v: any) => {
  const { redirect, path } = v;
  if (redirect) router.push(redirect);
  else router.push(path);
};
// 展开/收起左侧菜单点击
const onThemeConfigChange = () => {
  themeConfig.value.isCollapse = !themeConfig.value.isCollapse;
  setLocalThemeConfig();
};
// 存储布局配置
const setLocalThemeConfig = () => {
  Local.remove('themeConfig');
  Local.set('themeConfig', themeConfig.value);
};
// 处理面包屑数据
const getBreadcrumbList = (arr: Array<string>) => {
  let parents :any[] = []
  arr.map((item:any)=>{
    parents.push(...getBreadcrumbParent(item,route.path,null))
    if(parents.length>0){
      return
    }
  })
  parents.push(route)
  parents = uniqueByPath(parents)
  state.breadcrumbList = parents
};
const getBreadcrumbParent = (item:any,path:string,parent:any)=>{
  const parents:any[] = []
  if(item.path==path){
    if(parent){
      parents.push(parent)
    }
    return parents
  }
  if(item.children){
    for(let i=0;i<item.children.length;i++){
      const res = getBreadcrumbParent(item.children[i],path,item)
      if(res && res.length>0){
        parents.push(item,...res)
        return parents
      }
    }
  }
  return parents
}
const  uniqueByPath = (arr:any[]) => {
  let seen:any = {}; // 用来存储已见过的name
  let result:any[] = []; // 存储去重后的结果

  arr.forEach(item => {
    if (!seen[item.path]) { // 如果name还没见过
      seen[item.path] = true; // 标记为已见过
      result.push(item); // 添加到结果数组
    }
  });

  return result;
}
// 当前路由字符串切割成数组，并删除第一项空内容
const initRouteSplit = (path: string) => {
  if (!themeConfig.value.isBreadcrumb) return false;
  state.breadcrumbList = [routesList.value[0]];
  state.routeSplit = path.split('/');
  state.routeSplit.shift();
  state.routeSplitFirst = `/${state.routeSplit[0]}`;
  state.routeSplitIndex = 1;
  getBreadcrumbList(routesList.value);
  //if (route.name === 'home' || (route.name === 'notFound' && state.breadcrumbList.length > 1)) state.breadcrumbList.shift();
  //if (state.breadcrumbList.length > 0) state.breadcrumbList[state.breadcrumbList.length - 1].meta.tagsViewName = other.setTagsViewNameI18n(route);
};
// 页面加载时
onMounted(() => {
  initRouteSplit(route.path);
});
// 路由更新时
onBeforeRouteUpdate((to) => {
  initRouteSplit(to.path);
});
</script>

<style scoped lang="scss">
.layout-navbars-breadcrumb {
	flex: 1;
	height: inherit;
	display: flex;
	align-items: center;
	.layout-navbars-breadcrumb-icon {
		cursor: pointer;
		font-size: 18px;
		color: var(--next-bg-topBarColor);
		height: 100%;
		width: 40px;
		opacity: 0.8;
		&:hover {
			opacity: 1;
		}
	}
	.layout-navbars-breadcrumb-span {
		display: flex;
		opacity: 0.7;
		color: var(--next-bg-topBarColor);
	}
	.layout-navbars-breadcrumb-iconfont {
		font-size: 14px;
		margin-right: 5px;
	}
	:deep(.el-breadcrumb__separator) {
		opacity: 0.7;
		color: var(--next-bg-topBarColor);
	}
	:deep(.el-breadcrumb__inner a, .el-breadcrumb__inner.is-link) {
		font-weight: unset !important;
		color: var(--next-bg-topBarColor);
		&:hover {
			color: var(--el-color-primary) !important;
		}
	}
}
</style>
