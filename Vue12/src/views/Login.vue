<template>
  <div class="pdd-login">
    <div class="pdd-topbar">
      <div class="brand">
        <span class="logo-circle">新能源</span>
        <span class="brand-name">新能源汽车销量数据分析系统</span>
      </div>
      <div class="top-links">
        <a href="javascript:;" @click="tipVisible = true">帮助中心</a>
        <span>|</span>
        <a href="javascript:;" @click="tipVisible = true">联系我们</a>
      </div>
    </div>

    <div class="pdd-main">
      <div class="hero-side">
        <div class="hero-badge">ML · 智能分析</div>
        <h1>看懂销量 · 预测未来</h1>
        <p>实时监控训练指标，动态调参，多维可视化大屏一站掌控</p>
        <div class="hero-art">
          <div class="bubble b1"></div>
          <div class="bubble b2"></div>
          <div class="bubble b3"></div>
        </div>
      </div>

      <div class="login-card">
        <div class="tabs">
          <button :class="{ active: loginType === 'account' }" @click="loginType = 'account'">账号登录</button>
          <button :class="{ active: loginType === 'phone' }" @click="loginType = 'phone'">手机登录</button>
        </div>

        <form class="form" @submit.prevent="onSubmit">
          <div v-if="loginType === 'account'" class="field">
            <span class="icon">👤</span>
            <input v-model="form.username" placeholder="请输入用户名" autocomplete="username" />
          </div>
          <div v-else class="field">
            <span class="icon">📱</span>
            <input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </div>
          <div class="field">
            <span class="icon">🔒</span>
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <button type="button" class="eye" @click="showPwd = !showPwd">{{ showPwd ? '隐' : '显' }}</button>
          </div>

          <div class="row-between">
            <label class="remember">
              <input v-model="remember" type="checkbox" /> 记住登录
            </label>
            <a href="javascript:;" class="link" @click="tipVisible = true">忘记密码?</a>
          </div>

          <button class="submit" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>

        <div class="demo-box">
          <p>演示账号</p>
          <div class="demo-btns">
            <button type="button" @click="fillDemo('admin')">管理员 admin / admin123</button>
            <button type="button" @click="fillDemo('analyst')">分析师 analyst / 123456</button>
            <button type="button" @click="fillDemo('phone')">手机 13800138000</button>
          </div>
        </div>

        <div class="agree">
          登录即表示同意 <a href="javascript:;" @click="tipVisible = true">用户协议</a>
          和 <a href="javascript:;" @click="tipVisible = true">隐私政策</a>
        </div>
      </div>
    </div>

    <div class="pdd-footer">© 2025 新能源汽车销量数据分析系统 · Vue3 + ECharts + ML</div>

    <AppModal v-model="tipVisible" title="温馨提示">
      <p>这是演示系统弹窗，点击遮罩或右上角关闭按钮即可消失。</p>
      <p style="margin-top: 10px; color: #999; font-size: 13px;">
        管理员：admin / admin123（手机号 13800138000）<br />
        分析师：analyst / 123456<br />
        访客：viewer / 123456
      </p>
      <template #footer>
        <el-button type="danger" @click="tipVisible = false">我知道了</el-button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import AppModal from '@/components/AppModal.vue'

const router = useRouter()
const userStore = useUserStore()
const loginType = ref('account')
const showPwd = ref(false)
const remember = ref(true)
const loading = ref(false)
const tipVisible = ref(false)
const form = reactive({ username: '', phone: '', password: '' })

function fillDemo(type) {
  if (type === 'admin') {
    loginType.value = 'account'
    form.username = 'admin'
    form.password = 'admin123'
  } else if (type === 'analyst') {
    loginType.value = 'account'
    form.username = 'analyst'
    form.password = '123456'
  } else {
    loginType.value = 'phone'
    form.phone = '13800138000'
    form.password = 'admin123'
  }
}

async function onSubmit() {
  loading.value = true
  try {
    await userStore.login({
      loginType: loginType.value,
      username: form.username,
      phone: form.phone,
      password: form.password
    })
    ElMessage.success('登录成功')
    router.push('/screen/map')
  } catch {
    /* handled */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pdd-login {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff5f4 0%, #ffffff 40%, #fff8f7 100%);
  display: flex;
  flex-direction: column;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.pdd-topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  background: #fff;
  box-shadow: 0 1px 0 #f0f0f0;
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo-circle {
  width: 40px; height: 40px; border-radius: 50%;
  background: #e02e24; color: #fff; display: grid; place-items: center;
  font-size: 11px; font-weight: 700;
}
.brand-name { font-size: 18px; font-weight: 700; color: #333; }
.top-links { display: flex; gap: 10px; color: #999; font-size: 13px; }
.top-links a:hover { color: #e02e24; }

.pdd-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  padding: 40px 24px;
}
.hero-side { max-width: 420px; color: #333; }
.hero-badge {
  display: inline-block;
  background: #ffe8e6;
  color: #e02e24;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}
.hero-side h1 {
  font-size: 36px;
  line-height: 1.3;
  margin-bottom: 12px;
  color: #222;
}
.hero-side p { color: #888; font-size: 15px; line-height: 1.7; }
.hero-art { position: relative; height: 180px; margin-top: 28px; }
.bubble {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ff8a80, #e02e24);
  opacity: 0.85;
  animation: float 4s ease-in-out infinite;
}
.b1 { width: 120px; height: 120px; left: 20px; top: 20px; }
.b2 { width: 70px; height: 70px; left: 150px; top: 80px; animation-delay: 0.6s; background: radial-gradient(circle at 30% 30%, #ffd54f, #ff9800); }
.b3 { width: 48px; height: 48px; left: 240px; top: 30px; animation-delay: 1.2s; background: radial-gradient(circle at 30% 30%, #80deea, #00acc1); }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.login-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(224, 46, 36, 0.12);
  padding: 28px 28px 22px;
}
.tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 22px;
}
.tabs button {
  flex: 1; border: none; background: none; padding: 12px 0;
  font-size: 16px; color: #999; cursor: pointer; position: relative;
}
.tabs button.active { color: #e02e24; font-weight: 700; }
.tabs button.active::after {
  content: ''; position: absolute; left: 28%; right: 28%; bottom: 0;
  height: 3px; background: #e02e24; border-radius: 2px;
}
.field {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid #eee; border-radius: 8px;
  padding: 0 12px; height: 46px; margin-bottom: 14px;
  background: #fafafa; transition: border-color 0.2s;
}
.field:focus-within { border-color: #e02e24; background: #fff; }
.field input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 14px; color: #333;
}
.icon { font-size: 14px; opacity: 0.7; }
.eye {
  border: none; background: none; color: #999; cursor: pointer; font-size: 12px;
}
.row-between {
  display: flex; justify-content: space-between; align-items: center;
  margin: 4px 0 18px; font-size: 13px; color: #666;
}
.remember { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.link { color: #e02e24; }
.submit {
  width: 100%; height: 46px; border: none; border-radius: 24px;
  background: linear-gradient(90deg, #ff5a4f, #e02e24);
  color: #fff; font-size: 16px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 16px rgba(224, 46, 36, 0.35);
}
.submit:disabled { opacity: 0.7; cursor: not-allowed; }
.submit:hover:not(:disabled) { filter: brightness(1.05); }

.demo-box {
  margin-top: 18px; padding-top: 14px; border-top: 1px dashed #eee;
}
.demo-box p { font-size: 12px; color: #999; margin-bottom: 8px; }
.demo-btns { display: flex; flex-direction: column; gap: 6px; }
.demo-btns button {
  border: 1px solid #ffe0dd; background: #fff8f7; color: #e02e24;
  border-radius: 6px; padding: 6px 8px; font-size: 12px; cursor: pointer; text-align: left;
}
.demo-btns button:hover { background: #ffe8e6; }
.agree {
  margin-top: 14px; text-align: center; font-size: 12px; color: #aaa;
}
.agree a { color: #e02e24; }
.pdd-footer {
  text-align: center; padding: 16px; color: #bbb; font-size: 12px;
}

@media (max-width: 900px) {
  .hero-side { display: none; }
  .pdd-topbar { padding: 0 16px; }
  .brand-name { font-size: 14px; }
  .login-card { width: 100%; max-width: 400px; }
}
</style>
