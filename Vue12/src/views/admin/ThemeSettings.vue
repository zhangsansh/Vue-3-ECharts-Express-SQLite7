<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="hdr">
          <span>系统样式设置</span>
          <div>
            <el-button @click="reset">恢复默认</el-button>
            <el-button type="primary" @click="save">保存样式</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="24">
        <el-col :xs="24" :md="12">
          <el-form label-width="110px">
            <el-form-item label="系统标题">
              <el-input v-model="form.screenTitle" @input="preview" />
            </el-form-item>
            <el-form-item label="主色">
              <el-color-picker v-model="form.primaryColor" @change="preview" />
              <el-input v-model="form.primaryColor" style="width: 140px; margin-left: 8px" @input="preview" />
            </el-form-item>
            <el-form-item label="强调色">
              <el-color-picker v-model="form.accentColor" @change="preview" />
              <el-input v-model="form.accentColor" style="width: 140px; margin-left: 8px" @input="preview" />
            </el-form-item>
            <el-form-item label="背景色">
              <el-color-picker v-model="form.bgColor" @change="preview" />
              <el-input v-model="form.bgColor" style="width: 140px; margin-left: 8px" @input="preview" />
            </el-form-item>
            <el-form-item label="文字颜色">
              <el-color-picker v-model="form.textColor" @change="preview" />
              <el-input v-model="form.textColor" style="width: 140px; margin-left: 8px" @input="preview" />
            </el-form-item>
            <el-form-item label="边框颜色">
              <el-input v-model="form.borderColor" @input="preview" />
            </el-form-item>
            <el-form-item label="卡片背景">
              <el-input v-model="form.cardBg" @input="preview" />
            </el-form-item>
            <el-form-item label="背景渐变">
              <el-input v-model="form.bgGradient" type="textarea" :rows="2" @input="preview" />
            </el-form-item>
            <el-form-item label="字体">
              <el-select v-model="form.fontFamily" style="width: 100%" @change="preview">
                <el-option label="PingFang / 微软雅黑" value='"PingFang SC", "Microsoft YaHei", sans-serif' />
                <el-option label="思源黑体" value='"Noto Sans SC", "Source Han Sans SC", sans-serif' />
                <el-option label="宋体风格" value='"Songti SC", SimSun, serif' />
                <el-option label="等宽科技感" value='"JetBrains Mono", Consolas, monospace' />
                <el-option label="DIN + 雅黑" value='"DIN Alternate", "Microsoft YaHei", sans-serif' />
              </el-select>
            </el-form-item>
            <el-form-item label="字号">
              <el-slider v-model="form.fontSize" :min="12" :max="18" @input="preview" />
            </el-form-item>
          </el-form>
        </el-col>

        <el-col :xs="24" :md="12">
          <div class="preview panel" :style="previewStyle">
            <h3>{{ form.screenTitle }}</h3>
            <p>这是样式预览区域，可实时查看背景、字体与颜色效果。</p>
            <div class="preview-cards">
              <div class="pc">KPI 卡片</div>
              <div class="pc accent">强调色按钮</div>
            </div>
            <el-button type="primary" style="margin-top: 12px" @click="tip = true">打开弹窗示例</el-button>
          </div>
          <div class="presets">
            <div class="preset" v-for="p in presets" :key="p.name" @click="applyPreset(p)">
              <span class="swatch" :style="{ background: p.accentColor }"></span>
              {{ p.name }}
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <AppModal v-model="tip" title="弹窗可关闭">
      <p>点击遮罩层或右上角 × 即可关闭此弹窗。</p>
      <template #footer>
        <el-button type="primary" @click="tip = false">关闭</el-button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppModal from '@/components/AppModal.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const tip = ref(false)
const form = reactive({ ...themeStore.defaultTheme })

const previewStyle = computed(() => ({
  background: form.bgGradient,
  color: form.textColor,
  fontFamily: form.fontFamily,
  fontSize: form.fontSize + 'px',
  borderColor: form.borderColor
}))

const presets = [
  {
    name: '科技蓝',
    primaryColor: '#e02e24',
    accentColor: '#00d4ff',
    bgColor: '#0a1628',
    bgGradient: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0d2137 100%)',
    textColor: '#e8f1ff',
    cardBg: 'rgba(10, 30, 60, 0.75)',
    borderColor: 'rgba(0, 212, 255, 0.3)'
  },
  {
    name: '暗夜绿',
    primaryColor: '#2ecc71',
    accentColor: '#1abc9c',
    bgColor: '#0b1f17',
    bgGradient: 'linear-gradient(135deg, #0b1f17 0%, #123528 50%, #0a1a14 100%)',
    textColor: '#e8fff4',
    cardBg: 'rgba(10, 40, 28, 0.75)',
    borderColor: 'rgba(26, 188, 156, 0.35)'
  },
  {
    name: '琥珀橙',
    primaryColor: '#e67e22',
    accentColor: '#f39c12',
    bgColor: '#1a1208',
    bgGradient: 'linear-gradient(135deg, #1a1208 0%, #2a1c0c 50%, #1a1006 100%)',
    textColor: '#fff4e6',
    cardBg: 'rgba(40, 28, 12, 0.75)',
    borderColor: 'rgba(243, 156, 18, 0.35)'
  }
]

function preview() {
  themeStore.previewTheme({ ...form })
}

function applyPreset(p) {
  Object.assign(form, p)
  preview()
}

async function save() {
  await themeStore.updateTheme({ ...form })
  ElMessage.success('系统样式已保存')
}

function reset() {
  Object.assign(form, themeStore.defaultTheme)
  preview()
}

onMounted(() => {
  Object.assign(form, themeStore.theme)
})
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.card { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); }
.hdr { display: flex; justify-content: space-between; align-items: center; }
.preview {
  min-height: 260px; padding: 20px; border-radius: 10px;
  border: 1px solid var(--border);
}
.preview h3 { margin-bottom: 8px; letter-spacing: 2px; }
.preview-cards { display: flex; gap: 10px; margin-top: 16px; }
.pc {
  flex: 1; padding: 16px; border-radius: 8px; text-align: center;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
}
.pc.accent { background: var(--accent); color: #041018; font-weight: 700; }
.presets { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.preset {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
}
.preset:hover { border-color: var(--accent); }
.swatch { width: 14px; height: 14px; border-radius: 50%; }
</style>
