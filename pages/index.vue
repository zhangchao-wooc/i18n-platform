<template>
  <div class="home">
    <header class="home-header">
      <el-button type="primary" @click="() => {
        if(dialogFormVisible) {
          dialogFormVisible = false
        }
        dialogFormVisible = true
      }">创建应用</el-button>
    </header>
  
    <div class="home-list">
      <el-card class="home-list-card" shadow="hover" v-for="item in appList" :key="item.name">
        <template #header>
          <div class="home-list-card-header">
            <span class="home-list-card-header-name"></span>
            <el-dropdown @command="(command) => clickAppDropdown(command, item)">
              <span class="el-dropdown-link">
                <el-icon><More /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>

        <div class="home-list-card-body" @click="navigateTo({ path: '/app', query: {uuid: item.uuid }})">
          <div class="home-list-card-body-row">
            <p>应用名称</p>
            <div>{{ item.name || '-' }}</div>
          </div>
          <div class="home-list-card-body-row">
            <p>创建人</p>
            <div>{{ item.creator || '-' }}</div>
          </div>
          <div class="home-list-card-body-row">
            <p>创建时间</p>
            <div>{{ dayjs(item.createTime).format('YYYY年MM月DD HH:mm:ss') || '-' }}</div>
          </div>
          <div class="home-list-card-body-row">
            <p>描述</p>
            <div>{{ item.desc || '-' }}</div>
          </div>
        </div>
      </el-card>
    </div>
    <!-- create app -->
    <el-dialog :model-value="dialogFormVisible" :title="isEditApp ? '编辑应用' : '新建应用'" width="400" @close="createDialogClose">
      <el-form :model="form" :rules="rules" ref="ruleFormRef">
        <el-form-item label="应用名称" :label-width="formLabelWidth" prop="name">
          <el-input v-model="form.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="描述" :label-width="formLabelWidth" prop="desc">
          <el-input v-model="form.desc" autocomplete="off" />
        </el-form-item>
        <el-form-item>
          <template style="width: 100%; display: flex; justify-content: center;">
            <el-button type="primary" @click="isEditApp ? editApp() : create()">
              提交
            </el-button>
            <el-button @click="createDialogClose()">取消</el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus' 
  import * as dayjs from 'dayjs'

  // const loading = ref<boolean>(false)
  const appList = ref<any>({})
  const dialogFormVisible = ref<boolean>(false)
  const isEditApp = ref<boolean>(false)
  const currentActiveAppInfo = ref({ uuid: null })
  const formLabelWidth = '80px'
  const form = reactive({ name: '', desc: '' })
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

  const create = async () => {
    if (!ruleFormRef.value) return
    await ruleFormRef.value.validate(async (valid, fields) => {
      if (valid) {
        const {code, message} = await $fetch(`/api/app/create`, {
          method: "POST",
          body: { ...form, creator: 'wooc' }
        })
      
        if(code === 200) {
          ElMessage({ message: '创建成功', type: 'success' })
          createDialogClose()
          getAppList()
        } else {
          ElMessage({ message, type: 'error' })
        }
      } else {
        console.log('error submit!', fields)
      }
    })
  }

  const editApp = async () => {
    if (!ruleFormRef.value) return
    await ruleFormRef.value.validate(async (valid, fields) => {
      if (valid) {
        const {code, message} = await $fetch(`/api/app/edit`, {
          method: "POST",
          body: { data: {...form, editor: 'wooc'}, uuid: currentActiveAppInfo.value.uuid }
        })
      
        if(code === 200) {
          ElMessage({ message: '编辑成功', type: 'success' })
          createDialogClose()
          getAppList()
        } else {
          ElMessage({ message, type: 'error' })
        }
      } else {
        console.log('error submit!', fields)
      }
    })
  }

  const deleteApp = async (name: string | number) => {
    const { code, message } = await $fetch(`/api/app`, {
      method: "DELETE",
      query: { name }
    })

    if(code === 200) {
      getAppList()
      ElMessage({ message: '删除成功', type: 'success' })
    } else {
      ElMessage({ message, type: 'error' })
    }
  }

  const clickAppDropdown = (command: string | number | object, item: any) => {
    if(command === 'edit') {
      currentActiveAppInfo.value = item
      form.name = item.name
      form.desc = item.desc
      isEditApp.value = true
      dialogFormVisible.value = true
    } else if(command === 'delete') {
      ElMessageBox.confirm(
        '项目删除为高危操作，请三思而后行！',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '三思一下',
          type: 'warning',
        }) 
        .then(() => {
          deleteApp(item.name)
        })
    }
  }

  const createDialogClose = () => {
    ruleFormRef.value?.resetFields()
    dialogFormVisible.value = false
    currentActiveAppInfo.value = { uuid: null}
    isEditApp.value = false
  }
</script>

<style lang="scss" scoped>
  .home {
    &-header {
      padding: 10px;
      display: grid;
      align-items: center;
      justify-content: end;
    }
    &-list {
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, 220px);
      grid-template-rows: 250px;
      gap: 20px;
      &-card {
        ::v-deep(.el-card__header) {
          padding: 10px 10px;
        }
        ::v-deep(.el-card__body) {
          padding: 0;
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
          padding: 10px 15px;
          height: 213px;
          font-size: 12px;
          box-sizing: border-box;
          cursor: pointer;
          &-row {
            p {
              margin: 8px 0 5px;
              font-weight: 600;
            }
            div {
              word-break:break-all; 
            }
          }
        }
      }
    }
  }
</style>
