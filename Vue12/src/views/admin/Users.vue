<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="hdr">
          <span>用户管理</span>
          <div>
            <el-input v-model="keyword" placeholder="搜索用户名/手机号" clearable style="width: 220px; margin-right: 8px" @keyup.enter="load" />
            <el-button type="primary" @click="openCreate">添加用户</el-button>
          </div>
        </div>
      </template>
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ roleMap[row.role] || row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          layout="total, prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </div>
    </el-card>

    <AppModal v-model="visible" :title="editing ? '编辑用户' : '添加用户'" width="520px">
      <el-form label-width="90px">
        <el-form-item v-if="!editing" label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item :label="editing ? '新密码' : '密码'">
          <el-input v-model="form.password" type="password" :placeholder="editing ? '不改请留空' : ''" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" maxlength="11" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="分析师" value="analyst" />
            <el-option label="访客" value="viewer" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editing" label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
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
import { getUsers, createUser, updateUser, deleteUser } from '@/api'

const roleMap = { admin: '管理员', analyst: '分析师', viewer: '访客', user: '普通用户' }
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const visible = ref(false)
const editing = ref(null)
const form = reactive({ username: '', password: '', phone: '', nickname: '', role: 'user', status: 1 })

async function load() {
  const res = await getUsers({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
  list.value = res.data.list
  total.value = res.data.total
}

function openCreate() {
  editing.value = null
  Object.assign(form, { username: '', password: '', phone: '', nickname: '', role: 'user', status: 1 })
  visible.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, { username: row.username, password: '', phone: row.phone, nickname: row.nickname, role: row.role, status: row.status })
  visible.value = true
}

async function save() {
  if (editing.value) {
    const payload = { phone: form.phone, nickname: form.nickname, role: form.role, status: form.status }
    if (form.password) payload.password = form.password
    await updateUser(editing.value.id, payload)
  } else {
    await createUser({ ...form })
  }
  ElMessage.success('保存成功')
  visible.value = false
  load()
}

async function onDelete(row) {
  await ElMessageBox.confirm(`确认删除用户 ${row.username}？`, '提示')
  await deleteUser(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.card { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); }
.hdr { display: flex; justify-content: space-between; align-items: center; }
.pager { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
