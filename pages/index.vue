<template>
  <div class="home">
    <header class="home-header">
      <el-button type="primary" @click="dialogFormVisible = true">创建应用</el-button>
    </header>
  
    <div class="home-list">
      <el-card class="home-list-card" shadow="hover" v-for="item in appList" :key="item.name">
        <template #header>
          <div class="home-list-card-header">
            <span class="home-list-card-header-name">{{ item.name || '-' }}</span>
            <el-button type="primary" size="small" :icon="Edit" circle />
          </div>
        </template>
        <div class="home-list-card-body">
          <div class="home-list-card-body-row">
            <span>描述: </span>
            <span></span>
          </div>
          <div class="home-list-card-body-row">
            <span>创建人: </span>
            <span></span>
          </div>
          <div class="home-list-card-body-row">
            <span>创建时间: </span>
            <span></span>
          </div>
        </div>
      </el-card>
    </div>
    <!-- create app -->
    <el-dialog v-model="dialogFormVisible" title="新建应用" width="400">
      <el-form :model="form" :rules="rules" ref="ruleFormRef">
        <el-form-item label="应用名称" :label-width="formLabelWidth" prop="name">
          <el-input v-model="form.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="描述" :label-width="formLabelWidth" prop="desc">
          <el-input v-model="form.desc" autocomplete="off" />
        </el-form-item>
        <el-form-item>
          <template style="display: flex; justify-content: center;">
            <el-button type="primary" @click="create(ruleFormRef)">
              创建
            </el-button>
            <el-button @click="createDialogClose(ruleFormRef)">取消</el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue'
  import {
  Check,
  Delete,
  Edit,
  Message,
  Search,
  Star,
} from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus' 

  // const loading = ref<boolean>(false)
  const appList = ref<any>({})
  const dialogFormVisible = ref(false)
  const formLabelWidth = '80px'
  const form = reactive({
    name: '',
    desc: '',
  })
  const ruleFormRef = ref<FormInstance>()
  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入', trigger: 'blur' },
      { min: 1, max: 10, message: '长度为 1 - 10 个字符', trigger: 'blur' },
    ],
    desc: [
      { required: true, message: '请输入', trigger: 'blur' },
      { min: 1, max: 30, message: '长度为 1 - 30 个字符', trigger: 'blur' },
    ],
  })

  onBeforeMount(async () => {
    getAppList()
  })

  const getAppList = async () => {
    const loading = ElLoading.service({
      lock: true,
      text: 'Loading',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const {code, data, message} = await $fetch(`/api/app`)
    
    loading.close()

    if(code === 200) {
      appList.value = data
    } else {
      console.log('message')
    }
  }

  const create = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
      if (valid) {
        const {code, message} = await $fetch(`/api/app/create`, {
          method: "POST",
          body: form
        })
      
        if(code === 200) {
          ElMessage({
            message: '创建成功',
            type: 'success',
          })
          createDialogClose(ruleFormRef.value)
          getAppList()
        } else {
          ElMessage({
            message,
            type: 'error',
          })
        }
      } else {
        console.log('error submit!', fields)
      }
    })
  }

  const createDialogClose = (formEl: FormInstance | undefined) => {
    if (!formEl) return
      formEl.resetFields()
      dialogFormVisible.value = false
  }
</script>

<style lang="scss" scoped>
  .home {
    &-header {
      height: 80px;
      display: grid;
      align-items: center;
      justify-content: end;
    }
    &-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, 200px);
      grid-template-rows: 250px;
      gap: 20px;
      &-card {
        // &:hover {
        //   box-shadow: var(--el-box-shadow-dark);
        // }
        // ::v-deep(.el-card) {
        //   box-shadow: var(--el-box-shadow-lighter);
        // }
        ::v-deep(.el-card__header) {
          padding: 10px 10px;
        }
        &-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          &-name {
            font-weight: 600;
          }
        }
        &-body {
          display: grid;
          flex-direction: column;
          gap: 10px;
          font-size: 12px;
          height: 100%;
          &-row {
            span {
              &:nth-child(1) {
                font-weight: 600;
              }
            }
          }
        }
      }
    }
  }
</style>
