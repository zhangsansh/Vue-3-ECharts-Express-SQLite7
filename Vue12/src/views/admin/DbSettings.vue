<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="hdr">
          <span>数据库连接设置</span>
          <el-button type="primary" @click="openCreate">新增连接</el-button>
        </div>
      </template>
      <el-alert
        title="系统默认使用本地 SQLite 数据库存储用户与销量数据。此处可管理连接配置、测试连接。"
        type="info"
        :closable="true"
        show-icon
        style="margin-bottom: 16px"
        @close="() => {}"
      />
      <p class="path">当前 SQLite 路径：{{ currentPath }}</p>
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="host" label="主机" />
        <el-table-column prop="port" label="端口" width="90" />
        <el-table-column prop="database_name" label="库名/路径" />
        <el-table-column prop="is_active" label="启用" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="onTest(row)">测试</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <AppModal v-model="visible" :title="editing ? '编辑连接' : '新增连接'" width="560px">
      <el-form label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="SQLite" value="sqlite" />
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgres" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type !== 'sqlite'" label="主机"><el-input v-model="form.host" /></el-form-item>
        <el-form-item v-if="form.type !== 'sqlite'" label="端口"><el-input-number v-model="form.port" /></el-form-item>
        <el-form-item :label="form.type === 'sqlite' ? '文件路径' : '数据库名'">
          <el-input v-model="form.database_name" />
        </el-form-item>
        <el-form-item v-if="form.type !== 'sqlite'" label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item v-if="form.type !== 'sqlite'" label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="设为启用"><el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onTest(form)">测试连接</el-button>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppModal from '@/components/AppModal.vue'
import { getDbConfig, createDbConfig, updateDbConfig, deleteDbConfig, testDbConfig } from '@/api'

const list = ref([])
const currentPath = ref('')
const visible = ref(false)
const editing = ref(null)
const form = reactive({
  name: '', type: 'sqlite', host: '', port: 3306,
  database_name: '', username: '', password: '', is_active: 0
})

async function load() {
  const res = await getDbConfig()
  list.value = res.data.list
  currentPath.value = res.data.currentPath
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    name: '新连接', type: 'sqlite', host: '', port: 3306,
    database_name: currentPath.value, username: '', password: '', is_active: 0
  })
  visible.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, { ...row, password: '' })
  visible.value = true
}

async function save() {
  if (editing.value) await updateDbConfig(editing.value.id, { ...form })
  else await createDbConfig({ ...form })
  ElMessage.success('保存成功')
  visible.value = false
  load()
}

async function onTest(row) {
  const res = await testDbConfig({
    type: row.type || 'sqlite',
    database_name: row.database_name,
    host: row.host,
    port: row.port,
    username: row.username,
    password: row.password
  })
  ElMessage.success(res.message)
}

async function onDelete(row) {
  await ElMessageBox.confirm('确认删除该连接配置？', '提示')
  await deleteDbConfig(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.card { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); }
.hdr { display: flex; justify-content: space-between; align-items: center; }
.path { color: #8ab; margin-bottom: 12px; font-size: 13px; word-break: break-all; }
</style>
