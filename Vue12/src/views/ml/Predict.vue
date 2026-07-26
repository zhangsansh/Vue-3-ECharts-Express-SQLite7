<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="hdr">
              <span>机器学习销量预测</span>
              <el-radio-group v-model="mode" size="small">
                <el-radio-button value="manual">手动调参</el-radio-button>
                <el-radio-button value="upload">上传文件</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <el-form v-if="mode === 'manual'" label-width="100px">
            <el-form-item label="省份">
              <el-select v-model="form.province" filterable style="width: 100%">
                <el-option v-for="p in filters.provinces" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
            <el-form-item label="品牌">
              <el-select v-model="form.brand" filterable style="width: 100%">
                <el-option v-for="b in filters.brands" :key="b" :label="b" :value="b" />
              </el-select>
            </el-form-item>
            <el-form-item label="预测年月">
              <el-input-number v-model="form.year" :min="2024" :max="2030" />
              <el-input-number v-model="form.month" :min="1" :max="12" style="margin-left: 8px" />
            </el-form-item>
            <el-form-item label="学习率">
              <el-slider v-model="form.learning_rate" :min="0.0001" :max="0.01" :step="0.0001" show-input />
            </el-form-item>
            <el-form-item label="批次大小">
              <el-slider v-model="form.batch_size" :min="8" :max="256" :step="8" show-input />
            </el-form-item>
            <el-form-item label="训练轮数">
              <el-input-number v-model="form.epochs" :min="10" :max="300" />
            </el-form-item>
            <el-form-item label="平滑系数">
              <el-slider v-model="form.alpha" :min="0.05" :max="0.9" :step="0.05" show-input />
            </el-form-item>
            <el-button type="primary" :disabled="!userStore.canEdit" :loading="loading" @click="runPredict">
              开始预测
            </el-button>
          </el-form>

          <div v-else>
            <el-upload drag :auto-upload="false" :limit="1" accept=".xlsx,.xls,.csv" :on-change="onFile">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽或 <em>点击上传</em> Excel/CSV 销量序列</div>
            </el-upload>
            <el-form label-width="100px" style="margin-top: 16px">
              <el-form-item label="学习率">
                <el-slider v-model="form.learning_rate" :min="0.0001" :max="0.01" :step="0.0001" show-input />
              </el-form-item>
              <el-form-item label="批次大小">
                <el-slider v-model="form.batch_size" :min="8" :max="256" :step="8" show-input />
              </el-form-item>
              <el-form-item label="训练轮数">
                <el-input-number v-model="form.epochs" :min="10" :max="300" />
              </el-form-item>
            </el-form>
            <el-button type="primary" :disabled="!file || !userStore.canEdit" :loading="loading" @click="runUpload">
              上传并预测
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card class="card" shadow="never">
          <template #header>预测结果</template>
          <div class="result" v-if="result">
            <div class="r-item"><label>预测销量</label><b>{{ result.predicted?.toLocaleString?.() ?? result.predicted }}</b></div>
            <div class="r-item"><label>置信度</label><b>{{ ((result.confidence || 0) * 100).toFixed(1) }}%</b></div>
          </div>
          <div ref="chartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card" shadow="never" style="margin-top: 16px">
      <template #header>预测历史</template>
      <el-table :data="history" size="small" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="province" label="省份/来源" />
        <el-table-column prop="brand" label="品牌/文件" />
        <el-table-column prop="predicted_sales" label="预测销量" />
        <el-table-column prop="confidence" label="置信度" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useChart } from '@/composables/useChart'
import { useUserStore } from '@/stores/user'
import { predict, predictUpload, getPredictions, getFilters } from '@/api'

const userStore = useUserStore()
const mode = ref('manual')
const loading = ref(false)
const file = ref(null)
const result = ref(null)
const history = ref([])
const filters = ref({ provinces: [], brands: [] })
const chartRef = ref(null)
const form = reactive({
  province: '广东',
  brand: '比亚迪',
  year: 2025,
  month: 7,
  learning_rate: 0.001,
  batch_size: 32,
  epochs: 50,
  alpha: 0.3
})

useChart(chartRef, () => {
  const series = result.value?.series || []
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际', '拟合'] },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: series.map(s => s.year ? `${s.year}-${s.month}` : `#${s.index}`)
    },
    yAxis: { type: 'value' },
    series: [
      { name: '实际', type: 'line', data: series.map(s => s.actual), smooth: true },
      { name: '拟合', type: 'line', data: series.map(s => s.fitted), smooth: true }
    ]
  }
}, [result])

function onFile(f) {
  file.value = f.raw
}

async function runPredict() {
  loading.value = true
  try {
    const res = await predict({ ...form })
    result.value = res.data
    ElMessage.success('预测完成')
    loadHistory()
  } finally {
    loading.value = false
  }
}

async function runUpload() {
  if (!file.value) return
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    fd.append('learning_rate', form.learning_rate)
    fd.append('batch_size', form.batch_size)
    fd.append('epochs', form.epochs)
    fd.append('alpha', form.alpha)
    const res = await predictUpload(fd)
    result.value = res.data
    ElMessage.success('文件预测完成')
    loadHistory()
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  const res = await getPredictions()
  history.value = res.data
}

onMounted(async () => {
  const [f] = await Promise.all([getFilters(), loadHistory()])
  filters.value = f.data
  if (f.data.provinces?.length) form.province = f.data.provinces.includes('广东') ? '广东' : f.data.provinces[0]
  if (f.data.brands?.length) form.brand = f.data.brands.includes('比亚迪') ? '比亚迪' : f.data.brands[0]
})
</script>

<style scoped>
.page { max-width: 1400px; margin: 0 auto; }
.card { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); margin-bottom: 12px; }
.card :deep(.el-card__header) { color: var(--accent); border-bottom-color: var(--border); }
.hdr { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.result { display: flex; gap: 24px; margin-bottom: 12px; }
.r-item label { display: block; color: #8ab; font-size: 12px; }
.r-item b { font-size: 28px; color: var(--accent); }
.chart { height: 360px; }
</style>
