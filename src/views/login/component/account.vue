<template>
  <el-form ref="loginForm" size="large" class="login-content-form" :model="ruleForm"  :rules="formRules">
    <el-form-item class="login-animation1" prop="username">
      <el-input
          type="text"
          :placeholder="$t('message.account.accountPlaceholder1')"
          v-model="ruleForm.username"
          clearable autocomplete="off">
        <template #prefix>
          <el-icon class="el-input__icon"><ele-User /></el-icon>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item class="login-animation2" prop="password">
      <el-input
          :type="isShowPassword ? 'text' : 'password'"
          :placeholder="$t('message.account.accountPlaceholder2')"
          v-model="ruleForm.password"
          autocomplete="off"
          @keyup.enter="onSignIn"
      >
        <template #prefix>
          <el-icon class="el-input__icon"><ele-Unlock /></el-icon>
        </template>
        <template #suffix>
          <i
              class="iconfont el-input__icon login-content-password"
              :class="isShowPassword ? 'icon-yincangmima' : 'icon-xianshimima'"
              @click="isShowPassword = !isShowPassword"
          >
          </i>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item class="login-animation3" prop="verifyCode">
      <el-col :span="24">
        <GoCaptchaBtn
            class="go-captcha-btn"
            v-model="checkCaptchaResult"
            width="100%"
            height="50px"
            @handleConfirm="handleVerifyCodeConfirm"
            v-if="verifyStatus===2"
        />
      </el-col>
      <el-col :span="15" v-if="verifyStatus===1">
        <el-input
            type="text"
            maxlength="4"
            :placeholder="$t('message.account.accountPlaceholder3')"
            v-model="ruleForm.verifyCode"
            clearable
            autocomplete="off"
            @keyup.enter="onSignIn"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><ele-Position /></el-icon>
          </template>
        </el-input>
      </el-col>
      <el-col :span="1" v-if="verifyStatus===1"></el-col>
      <el-col :span="8" v-if="verifyStatus===1">
        <div class="login-content-code">
          <img
              class="login-content-code-img"
              @click="getCaptcha"
              width="130"
              height="38"
              :src="captchaSrc"
              style="cursor: pointer;"
          />
        </div>
      </el-col>
    </el-form-item>
    <el-form-item class="login-animation4">
      <el-button type="primary" class="login-content-submit" round @click="onSignIn" :loading="loading.signIn">
        <span>{{ $t('message.account.accountBtnText') }}</span>
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import {
  toRefs,
  reactive,
  defineComponent,
  computed,
  onMounted,
  getCurrentInstance,
  ref, unref
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import Cookies from 'js-cookie';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { initFrontEndControlRoutes } from '/@/router/frontEnd';
import { initBackEndControlRoutes } from '/@/router/backEnd';
import { Session } from '/@/utils/storage';
import { formatAxis } from '/@/utils/formatTime';
import { NextLoading } from '/@/utils/loading';
import {captcha, login} from "/@/api/login";
import GoCaptchaBtn from "/@/components/goCaptcha/GoCaptchaBtn.vue";
defineOptions({ name: "loginAccount"})
const { t } = useI18n();
const {proxy} = <any>getCurrentInstance();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const route = useRoute();
const router = useRouter();
const loginForm = ref(null)
const checkCaptchaResult = ref('default')
const verifyStatus = ref(0)
const state = reactive({
  isShowPassword: false,
  ruleForm: {
    username: 'demo',
    password: '123456',
    verifyCode: '',
    verifyKey:''
  },
  formRules:{
    username: [
      { required: true, trigger: "blur", message: "用户名不能为空" }
    ],
    password: [
      { required: true, trigger: "blur", message: "密码不能为空" }
    ]
  },
  loading: {
    signIn: false,
  },
  captchaSrc:'',
});
const { isShowPassword,ruleForm,formRules,loading,captchaSrc} = toRefs(state);
onMounted(() => {
  getCaptcha();
});
const getCaptcha = () => {
  // 验证码V1版
  captcha().then((res:any)=>{
    state.captchaSrc = res.data.img
    state.ruleForm.verifyKey = res.data.key
    verifyStatus.value = res.data.verifyStatus
  })
};
// 时间获取
const currentTime = computed(() => {
  return formatAxis(new Date());
});
// 登录
const onSignIn = async () => {
  if(state.loading.signIn){
    return
  }
  const formWrap = unref(loginForm) as any;
  if (!formWrap) return;
  formWrap.validate((valid: boolean) => {
    if(valid){
      state.loading.signIn = true;
      login(state.ruleForm).then(async (res:any)=>{
        const userInfo = res.data.userInfo
        userInfo.avatar = proxy.getUpFileUrl(userInfo.avatar)
        // 存储 token 到浏览器缓存
        Session.set('token', res.data.token);
        // 存储用户信息到浏览器缓存
        Session.set('userInfo', userInfo);
        // 设置用户菜单
        Session.set('userMenu',res.data.menuList)
        // 设置按钮权限
        Session.set('permissions',res.data.permissions)
        // 模拟数据，对接接口时，记得删除多余代码及对应依赖的引入。用于 `/src/stores/userInfo.ts` 中不同用户登录判断（模拟数据）
        Cookies.set('username', state.ruleForm.username);
        if (!themeConfig.value.isRequestRoutes) {
          // 前端控制路由，2、请注意执行顺序
          await initFrontEndControlRoutes();
          signInSuccess();
        } else {
          // 模拟后端控制路由，isRequestRoutes 为 true，则开启后端控制路由
          // 添加完动态路由，再进行 router 跳转，否则可能报错 No match found for location with path "/"
          await initBackEndControlRoutes();
          // 执行完 initBackEndControlRoutes，再执行 signInSuccess
          signInSuccess();
        }
      }).catch(()=>{
        state.loading.signIn = false;
        state.ruleForm.verifyKey = ''
        state.ruleForm.verifyCode = ''
        checkCaptchaResult.value = 'default'
        // 验证码V1版
        getCaptcha();
      })
    }
  })
};
// 登录成功后的跳转
const signInSuccess = () => {
  // 初始化登录成功时间问候语
  let currentTimeInfo = currentTime.value;
  // 登录成功，跳到转首页
  // 如果是复制粘贴的路径，非首页/登录页，那么登录成功后重定向到对应的路径中
  if (route.query?.redirect) {
    router.push({
      path: <string>route.query?.redirect,
      query: Object.keys(<string>route.query?.params).length > 0 ? JSON.parse(<string>route.query?.params) : '',
    });
  } else {
    router.push('/');
  }
  // 登录成功提示
  // 关闭 loading
  state.loading.signIn = true;
  const signInText = t('message.signInText');
  ElMessage.success(`${currentTimeInfo}，${signInText}`);
  // 添加 loading，防止第一次进入界面时出现短暂空白
  NextLoading.start();
};

const handleVerifyCodeConfirm = (data:{key:string,dots:string})=>{
  state.ruleForm.verifyCode = data.dots
  state.ruleForm.verifyKey = data.key
}
</script>


<style scoped lang="scss">
.login-content-form {
  margin-top: 20px;
  @for $i from 1 through 4 {
    .login-animation#{$i} {
      opacity: 0;
      animation-name: error-num;
      animation-duration: 0.5s;
      animation-fill-mode: forwards;
      animation-delay: calc($i/10) + s;
    }
  }
  .login-content-password {
    display: inline-block;
    width: 20px;
    cursor: pointer;
    &:hover {
      color: #909399;
    }
  }
  .login-content-code {
    display: flex;
    align-items: center;
    justify-content: space-around;
    .login-content-code-img {
      width: 100%;
      height: 40px;
      line-height: 40px;
      background-color: #ffffff;
      border: 1px solid rgb(220, 223, 230);
      cursor: pointer;
      transition: all ease 0.2s;
      border-radius: 4px;
      user-select: none;
      &:hover {
        border-color: #c0c4cc;
        transition: all ease 0.2s;
      }
    }
  }
  .login-content-submit {
    width: 100%;
    letter-spacing: 2px;
    font-weight: 300;
    margin-top: 15px;
  }
}
</style>
