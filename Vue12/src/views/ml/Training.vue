<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never" class="card">
          <template #header>训练参数配置</template>
          <el-form label-width="100px">
            <el-form-item label="实验名称">
              <el-input v-model="form.name" placeholder="例如：销量预测模型-v1" />
            </el-form-item>
            <el-form-item label="学习率">
              <el-slider v-model="form.learning_rate" :min="0.0001" :max="0.01" :step="0.0001" show-input />
            </el-form-item>
            <el-form-item label="批次大小">
              <el-slider v-model="form.batch_size" :min="8" :max="256" :step="8" show-input />
            </el-form-item>
            <el-form-item label="训练轮数">
              <el-input-number v-model="form.epochs" :min="10" :max="200" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :disabled="!!runningId || !userStore.canEdit" @click="start">启动训练</el-button>
              <el-button type="danger" :disabled="!runningId" @click="stop">停止</el-button>
            </el-form-item>
          </el-form>

          <el-divider>训练中动态调参</el-divider>
          <el-form label-width="100px">
            <el-form-item label="实时学习率">
              <el-slider v-model="live.learning_rate" :min="0.0001" :max="0.01" :step="0.0001" :disabled="!runningId" @change="applyParams" />
            </el-form-item>
            <el-form-item label="实时批次">
              <el-slider v-model="live.batch_size" :min="8" :max="256" :step="8" :disabled="!runningId" @change="applyParams" />
            </el-form-item>
          </el-form>

          <div class="status">
            <el-tag :type="statusType">{{ statusText }}</el-tag>
            <span v-if="metrics.epoch">Epoch {{ metrics.epoch }} / {{ metrics.total }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="never" class="card">
          <template #header>实时训练指标监控</template>
          <div class="metric-row">
            <div class="m"><label>Loss</label><b>{{ metrics.loss ?? '-' }}</b></div>
            <div class="m"><label>Val Loss</label><b>{{ metrics.val_loss ?? '-' }}</b></div>
            <div class="m"><label>Accuracy</label><b>{{ metrics.accuracy ?? '-' }}</b></div>
            <div class="m"><label>Val Acc</label><b>{{ metrics.val_accuracy ?? '-' }}</b></div>
            <div class="m"><label>LR</label><b>{{ metrics.learning_rate ?? '-' }}</b></div>
            <div class="m"><label>Batch</label><b>{{ metrics.batch_size ?? '-' }}</b></div>
          </div>
          <div ref="chartRef" class="train-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="card" style="margin-top: 16px">
      <template #header>历史实验</template>
      <el-table :data="experiments" size="small" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="learning_rate" label="学习率" width="100" />
        <el-table-column prop="batch_size" label="批次" width="80" />
        <el-table-column prop="epochs" label="轮数" width="80" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useChart } from '@/composables/useChart'
import { useUserStore } from '@/stores/user'
import { startTrain, updateTrainParams, stopTrain, getExperiments } from '@/api'

const userStore = useUserStore()
const form = reactive({ name: '', learning_rate: 0.001, batch_size: 32, epochs: 40 })
const live = reactive({ learning_rate: 0.001, batch_size: 32 })
const runningId = ref(null)
const metrics = ref({})
const experiments = ref([])
const chartRef = ref(null)
let es = null

const statusText = computed(() => metrics.value.status || (runningId.value ? 'running' : 'idle'))
const statusType = computed(() => {
  const s = statusText.value
  if (s === 'running') return 'warning'
  if (s === 'completed') return 'success'
  if (s === 'stopped') return 'info'
  return ''
})

useChart(chartRef, () => {
  const h = metrics.value.history || {}
  const epochs = (h.loss || []).map((_, i) => i + 1)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['loss', 'val_loss', 'accuracy', 'val_accuracy'] },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: epochs, name: 'epoch' },
    yAxis: [
      { type: 'value', name: 'loss', min: 0 },
      { type: 'value', name: 'acc', min: 0, max: 1 }
    ],
    series: [
      { name: 'loss', type: 'line', data: h.loss || [], smooth: true },
      { name: 'val_loss', type: 'line', data: h.val_loss || [], smooth: true },
      { name: 'accuracy', type: 'line', yAxisIndex: 1, data: h.accuracy || [], smooth: true },
      { name: 'val_accuracy', type: 'line', yAxisIndex: 1, data: h.val_accuracy || [], smooth: true }
    ]
  }
}, [metrics])

async function refreshList() {
  const res = await getExperiments()
  experiments.value = res.data
}

async function start() {
  const res = await startTrain({ ...form })
  runningId.value = res.data.id
  live.learning_rate = form.learning_rate
  live.batch_size = form.batch_size
  ElMessage.success('训练已启动，可实时调整学习率与批次大小')
  connectStream(res.data.id)
  refreshList()
}

function connectStream(id) {
  es?.close()
  es = new EventSource(`/api/ml/train/${id}/stream`)
  es.onmessage = (ev) => {
    const payload = JSON.parse(ev.data)
    metrics.value = payload
    if (payload.status === 'completed' || payload.status === 'stopped') {
      runningId.value = null
      es?.close()
      refreshList()
    }
  }
}

async function applyParams() {
  if (!runningId.value) return
  await updateTrainParams(runningId.value, {
    learning_rate: live.learning_rate,
    batch_size: live.batch_size
  })
  ElMessage.success('参数已动态更新')
}

async function stop() {
  if (!runningId.value) return
  await stopTrain(runningId.value)
  runningId.value = null
  es?.close()
  refreshList()
}

onMounted(refreshList)
onBeforeUnmount(() => es?.close())
</script>

<style scoped>
.page { max-width: 1400px; margin: 0 auto; }
.card { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); }
.card :deep(.el-card__header) { color: var(--accent); border-bottom-color: var(--border); }
.metric-row {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 12px;
}
.m {
  background: rgba(0,212,255,0.08); border-radius: 8px; padding: 10px; text-align: center;
}
.m label { display: block; color: #8ab; font-size: 12px; }
.m b { font-size: 18px; color: var(--accent); }
.train-chart { height: 360px; }
.status { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
@media (max-width: 900px) {
  .metric-row { grid-template-columns: repeat(3, 1fr); }
}
</style>
