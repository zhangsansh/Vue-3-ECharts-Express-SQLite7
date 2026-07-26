<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="hdr">
          <span>销量数据管理</span>
          <div class="actions">
            <el-select v-model="query.province" clearable placeholder="省份" style="width: 120px" @change="load">
              <el-option v-for="p in filters.provinces" :key="p" :label="p" :value="p" />
            </el-select>
            <el-select v-model="query.brand" clearable placeholder="品牌" style="width: 120px" @change="load">
              <el-option v-for="b in filters.brands" :key="b" :label="b" :value="b" />
            </el-select>
            <el-button type="primary" @click="openCreate">新增</el-button>
            <el-button @click="onExport">导出Excel</el-button>
            <el-upload :show-file-list="false" accept=".xlsx,.xls,.csv" :auto-upload="false" :on-change="onImport">
              <el-button type="success">导入Excel</el-button>
            </el-upload>
          </div>
        </div>
      </template>

      <el-table :data="list" stripe height="560">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="province" label="省份" width="90" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="model" label="车型" />
        <el-table-column prop="vehicle_type" label="类型" width="100" />
        <el-table-column prop="sales_count" label="销量" width="90" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column label="年月" width="100">
          <template #default="{ row }">{{ row.year }}-{{ row.month }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
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
          layout="total, sizes, prev, pager, next"
          :page-sizes="[20, 50, 100]"
          :total="total"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </el-card>

    <AppModal v-model="visible" :title="editing ? '编辑数据' : '新增数据'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="省份"><el-input v-model="form.province" /></el-form-item>
        <el-form-item label="城市"><el-input v-model="form.city" /></el-form-item>
        <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
        <el-form-item label="车型"><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.vehicle_type" style="width: 100%">
            <el-option label="纯电动" value="纯电动" />
            <el-option label="插电混动" value="插电混动" />
            <el-option label="增程式" value="增程式" />
          </el-select>
        </el-form-item>
        <el-form-item label="销量"><el-input-number v-model="form.sales_count" :min="0" /></el-form-item>
        <el-form-item label="金额"><el-input-number v-model="form.amount" :min="0" :step="100" /></el-form-item>
        <el-form-item label="年/月">
          <el-input-number v-model="form.year" :min="2018" :max="2035" />
          <el-input-number v-model="form.month" :min="1" :max="12" style="margin-left: 8px" />
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
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppModal from '@/components/AppModal.vue'
import { getSales, createSale, updateSale, deleteSale, getFilters, importSales, exportSales } from '@/api'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = ref({ provinces: [], brands: [] })
const query = reactive({ province: '', brand: '' })
const visible = ref(false)
const editing = ref(null)
const form = reactive({
  province: '', city: '', brand: '', model: '', vehicle_type: '纯电动',
  sales_count: 0, amount: 0, year: 2025, month: 1
})

async function load() {
  const res = await getSales({
    page: page.value, pageSize: pageSize.value,
    province: query.province || undefined,
    brand: query.brand || undefined
  })
  list.value = res.data.list
  total.value = res.data.total
}

function openCreate() {
  editing.value = null
  Object.assign(form, {
    province: '广东', city: '广东', brand: '比亚迪', model: '', vehicle_type: '纯电动',
    sales_count: 100, amount: 2000, year: 2025, month: 1
  })
  visible.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, { ...row })
  visible.value = true
}

async function save() {
  if (editing.value) await updateSale(editing.value.id, { ...form })
  else await createSale({ ...form })
  ElMessage.success('保存成功')
  visible.value = false
  load()
}

async function onDelete(row) {
  await ElMessageBox.confirm('确认删除该条记录？', '提示')
  await deleteSale(row.id)
  ElMessage.success('已删除')
  load()
}

async function onExport() {
  const res = await exportSales({
    province: query.province || undefined,
    brand: query.brand || undefined
  })
  const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `sales_export_${Date.now()}.xlsx`)
}

function onImport(file) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const wb = XLSX.read(e.target.result, { type: 'array' })
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    const res = await importSales(rows)
    ElMessage.success(res.message)
    load()
  }
  reader.readAsArrayBuffer(file.raw)
}

onMounted(async () => {
  const f = await getFilters()
  filters.value = f.data
  load()
})
</script>

<style scoped>
.page { max-width: 1400px; margin: 0 auto; }
.card { background: var(--card-bg); border: 1px solid var(--border); color: var(--text); }
.hdr { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.pager { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
