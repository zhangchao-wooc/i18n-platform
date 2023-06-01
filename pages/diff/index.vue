<template>
  <div class="diff">
    <div class="diff-upload">
      <w-upload v-if="fileList.length !== 2" class="diff-upload-button" type="button" :buttonText="buttonText" :accept="accept" :fileUpload="fileUpload"  />
      <el-button v-else type="primary" class="diff-upload-button" @click="clearFile">
        清空文件
        <el-icon  class="diff-upload-button-icon"><Delete /></el-icon>
      </el-button>
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
        <div class="diff-dialog-info-item" v-for="item in Object.keys(JSON.parse(diffResult))" :key="item">
        {{ exportDiffTypeList.filter(d => d.value === item)[0].label }} : {{ JSON.parse(diffResult)[item].length }}</div>
      </div>
      <el-input
        v-model="diffResult"
        autosize
        type="textarea"
      />
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
  const diffResult = ref('')
  const dialogVisible = ref(false)
  const exportFileType = ref('.json')
  const exportFileTypeList = ref<Record<string, string>[]>(initExportFileTypeList)
  const exportDiffType = ref<'add' | 'remove' | 'change' | 'empty' | 'all'>('add')
  const exportDiffTypeList = ref<Record<string, string>[]>(initExportDiffTypeList)

  const buttonText = computed(() => {
    switch(fileList.value.length) {
      case 0:
        return '原始文件'
      case 1:
        return '最新文件'
    }
  })

  const fileUpload = async (file: any) => {
    
    const loading = ElLoading.service({
      lock: true,
      text: '文件处理中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    const fielData = file[file.length - 1]
    const type = fileTypeMap[fielData['file']['type']]
    
    if(typeof type !== 'string') return ElNotification({
        title: `文件类型错误`,
        message: h('i', { style: 'color: teal' },  `不支持的文件类型: ${fielData['file']['type']}`),
        type: 'error',
      })
    
    let data: Record<string, string> = {}

    if(type === 'json') {
      data = JSON.parse(fielData['fileContent'])
    }

    if(type === 'xml') {
      const result = await parserXmlData('xml', fielData['fileContent'])
      console.log('xml', result)
      data = result
    }

    if(type === 'xlsx') {
      // const result = await parserXmlData('xml', fielData['fileContent'])
      console.log('xlsx', type)
    }
    
    const name = fielData['file']['name'].split('.')[0]

    fileList.value.push({
      type,
      data,
      name
    })

    if(fileList.value.length === 2) {
      console.log(1)
      dialogVisible.value = true
      diffResult.value = JSON.stringify(diffJson(fileList.value[0].data, fileList.value[1].data), null, 4)
      
    }

    setTimeout(() => {
      loading.close()
    }, 1000)
  }

  const parserXmlData = async (fileType: 'xml' | 'xlsx', fileData: string) => {
    const { data, pending, error } = await useFetch('/api/parser', {
      method: "post",
      body: {
        fileType,
        fileData
      }
    })
    if (!error.value) {
      return data.value?.data || {}
    } else {
      console.log(error.value)
      return {}
    }
  }

  const exportFileToLocal = async () => {
    const { data, pending, error } = await useFetch('/api/convert', {
      method: "post",
      body: {
        data: JSON.parse(diffResult.value),
        type: 'xml',
        scene: 'DIFF',
        diffType: exportDiffType.value
      }
    })
    if (!error.value) {
      exportFile({
        data: data.value?.data,
        name: exportDiffType.value,
        type: 'xml'
      })
    } else {
      console.log(error.value)
      return {}
    }
    
  }

  const clearFile = () => {
    fileList.value = []
    dialogVisible.value = false
  }

  const handleClose = () => {
    dialogVisible.value = false
    diffResult.value = JSON.stringify({}, null, 4)
  }
</script>

<style lang="scss" scoped>
  .diff {
    &-upload {
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

  ::v-deep(.el-dialog__header) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
