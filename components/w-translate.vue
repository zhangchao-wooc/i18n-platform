<template>
  <el-dialog
    class="w-translate"
    v-model="dialogVisible"
    title="批量翻译"
    :fullscreen="true"
    :before-close="close"
  >
    <el-form
      ref="translateFormRef"
      :model="translateForm"
      :inline="true"
      label-width="100px"
      class="w-translate-form"
      status-icon
    >
      <el-form-item label="已上传语言" prop="selectedLang" required>
        <el-select v-model="translateForm.selectedLang" placeholder="已上传语言">
          <el-option v-for="item in Object.keys(standerdJson)" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="源语言" prop="sourceLang" required>
        <el-select v-model="translateForm.sourceLang" placeholder="源语言">
          <el-option v-for="item in languageList" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标语言" prop="targetLang" required>
        <el-select v-model="translateForm.targetLang" placeholder="目标语言">
          <el-option v-for="item in languageList" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm(translateFormRef)">
          开始翻译
        </el-button>
        <el-button @click="resetForm(translateFormRef)">重置</el-button>
      </el-form-item>
    </el-form>

    <pre v-if="Object.keys(translateResult).length" class="json-show" >{{ JSON.stringify(translateResult, null, 4) }}</pre>
    <el-empty v-else description="暂无翻译数据" />

    <template v-if="Object.keys(translateResult).length > 0" #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="handleClose('MERGE')">
          合并翻译结果
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance, Action } from 'element-plus'

const props = defineProps({
  data: {
    type: Array,
    default: []
  },
  cb: {
    type: Function,
    required: true
  }
})

const dialogVisible = ref(true)
const standerdJson = ref<Record<string, any>>({})
const translateFormRef = ref<FormInstance>()
const translateForm = reactive({
  selectedLang: '',
  sourceLang: '',
  targetLang: ''
})
const languageList = ref([
  {
    label: '中文',
    value: 'zh'
  },
  {
    label: '英语',
    value: 'en'
  },
  {
    label: '德语',
    value: 'de'
  },
  {
    label: '西班牙语',
    value: 'spa'
  }
])
const translateResult = ref<Record<string, any>>({})

onMounted(() => {
  standerdJson.value = table2StanderdJson(props.data)
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      if(translateForm.targetLang === translateForm.sourceLang) {
        ElMessageBox.confirm(
          '原语言与目标语言相同，请重新选择！',
          'Warning',
          {
            showCancelButton: false,
            confirmButtonText: '好的',
            type: 'warning',
            draggable: true,
          }
        )
        return 
      }
      console.log('submit!', translateForm)
      const loading = ElLoading.service({
        lock: true,
        text: '翻译中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
      for(const code in standerdJson.value[translateForm.selectedLang]) {
        const result = await translate(standerdJson.value[translateForm.selectedLang][code])
        if (isString(result)) {
          if(translateResult.value[translateForm.targetLang]) {
            translateResult.value[translateForm.targetLang][code] = result
          } else {
            translateResult.value[translateForm.targetLang] = {}
            translateResult.value[translateForm.targetLang][code] = result
            setTimeout(() => {
              var element = document.querySelector('.json-show'); // 获取需要滚动的元素
              // 在内容变化时自动滚动到底部
              console.log(element)
              //@ts-ignore addEventListener
              element.addEventListener("DOMSubtreeModified", function () {
                //@ts-ignore
                element.scrollTop = element.scrollHeight;
              });
            })
          }
        } else {
          loading.close()
          return
        }
      }
      loading.close()
      ElNotification({
        title: 'Success',
        message: '翻译完成！',
        type: 'success',
      })
    } else {
      console.log('error submit!', fields)
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}


const translate = async (value: string) => {
    const { data, pending, error } = await useFetch('/api/translate', {
      method: "post",
      body: {
        value,
        sourceLang: translateForm.sourceLang,
        targetLang: translateForm.targetLang
      }
    })
    if (!error.value) {
      if(data?.value?.code === 200) {
        return data?.value?.data
      } else {
        ElMessageBox.alert(
          `
            <p>错误码：${data?.value?.code}</p>
            <p>错误信息：${data?.value?.message}</p>  
            <a href="https://fanyi-api.baidu.com/doc/21" target="_blank">帮助页面</a>
          `, 
          '翻译出错', 
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '好的',
            callback: (action: Action) => {
            },
          }
        )
        return data.value
      }
    } else {
      console.log(error.value)
      return error.value
    }
  }

const handleClose = (handle?: string) => {
  if( handle === 'MERGE') {
    props.cb(translateResult.value)
  }
}

const close = () => {
  props.cb()
}

</script>

<style lang="scss" scoped>
  .w-translate {
    .json-show {
      background-color: #000;
      color: #fff;
      padding: 10px;
      height: 60vh;
      overflow: auto;
    }
  }
  
</style>
