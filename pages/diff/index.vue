<template>
  <div class="diff">
    <div class="diff-upload">
      <el-button v-if="fileList.length > 0" type="primary" class="diff-upload-button" @click="clearFile">
        清空文件
        <el-icon  class="diff-upload-button-icon"><Delete /></el-icon>
      </el-button>
      <el-button :disabled="fileList.length !== 2" type="primary" @click="contrast">
        开始比对
      </el-button>
    </div>

    <div class="diff-content">
      <div class="diff-content-source">
        <p v-if="fileList.length > 0">原数据</p>
        <pre v-if="fileList.length > 0" class="json-show">{{ JSON.stringify(fileList[0].data, null, 4) }}</pre>
        <el-empty v-else>
          <w-upload v-if="fileList.length === 0" class="diff-upload-button" type="button" buttonText="上传原数据" :accept="accept" :fileUpload="fileUpload"  />
        </el-empty>
      </div>
      <div class="diff-content-contrast">
        <p v-if="fileList.length > 1">新数据</p>
        <pre v-if="fileList.length > 1" class="json-show">{{ JSON.stringify(fileList[1].data, null, 4) }}</pre>
        <el-empty v-else>
          <w-upload v-if="fileList.length === 1" class="diff-upload-button" type="button" buttonText="上传新数据" :accept="accept" :fileUpload="fileUpload"  />
        </el-empty>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="Diff 结果"
      width="80%"
      :before-close="handleClose"
    >
      <template #header>
        <el-select v-model="exportDiffType" class="diff-dialog-select" placeholder="请选择导出的 Diff 数据类型">
          <el-option
            v-for="item in exportDiffTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select v-model="exportFileType" class="diff-dialog-select" placeholder="请选择导出的文件类型">
          <el-option
            v-for="item in exportFileTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-button type="primary" class="diff-upload-export" @click="exportFileToLocal">
          导出增量文件
          <el-icon  class="diff-upload-button-icon"><Folder /></el-icon>
        </el-button>
      </template>

      <div class="diff-dialog-info">
        <div class="diff-dialog-info-item" v-for="item in Object.keys(diffResult)" :key="item">
        {{ exportDiffTypeList.filter(d => d.value === item)[0].label }} : {{ diffResult[item].length }}</div>
      </div>

      <pre class="json-show" style="width:auto">{{diffResult}}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { diffJson } from '../../utils/diff'
  import { exportFile } from '../../utils/exportFile'

  definePageMeta({
    title: 'Diff - i18n-platform'
  })

  interface FileListType {
    data: Record<string, string>
    type: string
    name: string
  }

  const initExportDiffTypeList = [
    {
      label: '全部数据',
      value: 'all'
    },
    {
      label: '增量数据',
      value: 'add'
    },
    {
      label: '减少数据',
      value: 'remove'
    },
    {
      label: '变更数据',
      value: 'change'
    },
    {
      label: '空数据',
      value: 'empty'
    }
  ]

  const initExportFileTypeList = [
    {
      label: 'json',
      value: '.json'
    },
    {
      label: 'xml',
      value: '.xml'
    },
    {
      label: 'xlsx',
      value: '.xlsx'
    },
  ]

  const initAccept = '.xml,.json,.xlsx'
  const fileTypeMap: Record<string, string> = {
    'application/json': 'json',
    'text/xml': 'xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  }

  const accept = ref(initAccept)
  const fileList = ref<FileListType[]>([])
  const diffResult = ref<Record<string, any>>({})
  const dialogVisible = ref(false)
  const exportFileType = ref('.json')
  const exportFileTypeList = ref<Record<string, string>[]>(initExportFileTypeList)
  const exportDiffType = ref<'add' | 'remove' | 'change' | 'empty' | 'all'>('add')
  const exportDiffTypeList = ref<Record<string, string>[]>(initExportDiffTypeList)

  const fileUpload = async (file: any) => {
    console.log('1')
    const loading = ElLoading.service({
      lock: true,
      text: '文件处理中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    const fielData = file[file.length - 1]
    const type = fileTypeMap[fielData['file']['type']]
    const name = fielData['file']['name'].split('.')[0]
    
    if(typeof type !== 'string') return ElNotification({
      title: `文件类型错误`,
      message: h('i', { style: 'color: teal' },  `不支持的文件类型: ${fielData['file']['type']}`),
      type: 'error',
    })
    
    let data: Record<string, any> = {}

    if(type === 'json') {
      // Reflect.set(data, name, JSON.parse(fielData['fileContent']))
      const result = toStanderdJson(JSON.parse(fielData['fileContent']), name)
      if (isString(result)) {
        ElNotification({
          title: `文件类型错误`,
          message: h('i', { style: 'color: teal' },  result),
          type: 'error',
        })
      } else {
        //@ts-ignore
        data = result[name]
      }
      // data = JSON.parse(fielData['fileContent'])
    }

    if(type === 'xml') {
      const result = await parserXmlData('xml', fielData['fileContent'])
      console.log('xml', result)
      // Reflect.set(data, name, result)
      data = result
    }

    if(type === 'xlsx') {
      // const result = await parserXmlData('xml', fielData['fileContent'])
      console.log('xlsx', type)
    }
    
    fileList.value.push({ type, data, name })

    setTimeout(() => {
      loading.close()
    }, 1000)
  }

  const parserXmlData = async (fileType: 'xml' | 'xlsx', fileData: string) => {
    const { data, message, code } = await $fetch(`/api/parser/${fileType}`, {
      method: "post",
      body: { fileType, fileData }
    })
    if (code === 200) {
      return data || {}
    } else {
      ElMessage({message,  type: 'error'})
      return {}
    }
  }

  const exportFileToLocal = async () => {
    const exportData = exportDiffType.value === 'all' ? diffResult.value : diffResult.value[exportDiffType.value] || {}

    switch(exportFileType.value) {
      case '.json':
        exportFile({
          data: JSON.stringify(exportData, null, 4),
          name: `diff-${exportDiffType.value}-${new Date().getTime()}`,
          type: 'json'
        })
        break;
      case '.xml':
        exportXml(exportData)
        break;
      default:
    }
  }

  const exportXml = async (exportData: any) => {
    const { data, message, code } = await $fetch('/api/convert', {
      method: "post",
      body: {
        data: exportData,
        type: 'xml',
        scene: 'DIFF',
        diffType: exportDiffType.value
      }
    })
    if (code === 200) {
      exportFile({
        data,
        name: `diff-${exportDiffType.value}-${new Date().getTime()}`,
        type: 'xml'
      })
    } else {
      ElMessage({message,  type: 'error'})
    }
  }

  const clearFile = () => {
    fileList.value = []
    dialogVisible.value = false
  }

  const handleClose = () => {
    dialogVisible.value = false
    diffResult.value = {}
  }

  const contrast = () => {
    dialogVisible.value = true
    console.log(fileList.value[0].data, fileList.value[1].data)
    diffResult.value = diffJson(fileList.value[0].data, fileList.value[1].data)
  }
</script>

<style lang="scss" scoped>
  .diff {
    height: 100%;
    &-upload {
      padding: 10px;
      display: flex;
      justify-content: flex-end;
      &-button {
        width: 120px;
        &-icon {
          margin-left: 3px;
        }
      }
      &-export {
        margin: 10px 0;
      }
    }

    &-content {
      height: calc(100% - 60px);
      padding: 10px;
      display: flex;
      justify-content: space-between;
      box-sizing: border-box;
      &-source, &-contrast {
        width: 49%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }

    &-dialog {
      
      &-info {
        display: flex;
        justify-content: center;
        &-item {
          margin: 0 10px 10px;
        }
      }
      &-select {
        margin-right: 10px;
      }
    }
  }

  .json-show {
    margin: 0;
    background-color: #000;
    color: #fff;
    padding: 10px;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  ::v-deep(.el-dialog__header) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
