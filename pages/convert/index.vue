<template>
  <div class="convert">
    <div class="convert-contorl">
      <el-dropdown split-button type="primary">
        导出文件
        <template #dropdown>
          <el-dropdown-menu>
            <template v-for="item in exportFileTypeList" :key="item.value" >
              <el-dropdown-item>
                <div @click="classificationExport(item.value)">{{ item.label }}</div>
                
              </el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="convert-section">
      <w-upload class="convert-section-upload" type="button" buttonText="上传文件" :accept="accept" :fileUpload="fileUpload"  />
    </div>
    
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import * as XLSX from 'xlsx';
  import { exportFile } from '../../utils/exportFile'
  import { xlsx2Json } from '../../utils/parser'

  definePageMeta({
    title: 'Convert - i18n-platform'
  })

  interface FileListType {
    data: Record<string, string>
    type: 'xml' | 'xlsx' | 'json'
    name: string
  }

  const initExportFileTypeList: Record<string, FileListType['type']>[] = [
    {
      label: 'json',
      value: 'json'
    },
    {
      label: 'xml',
      value: 'xml'
    },
    {
      label: 'xlsx',
      value: 'xlsx'
    },
  ]
  const initAccept = '.xml,.json,.xlsx'
  const fileTypeMap: Record<string, FileListType['type']> = {
    'application/json': 'json',
    'text/xml': 'xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  }

  const exportFileTypeList = ref<Record<string, FileListType['type']>[]>(initExportFileTypeList)
  const accept = ref(initAccept)
  const fileData = ref<FileListType>({
    data: {},
    type: 'json',
    name: ''
  })

  const fileUpload = async (file: any) => {
    
    const loading = ElLoading.service({
      lock: true,
      text: '文件处理中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    const lastFileData = file[file.length - 1]
    console.log(lastFileData)
    const type: FileListType['type'] = fileTypeMap[lastFileData['file']['type']]
    
    if(typeof type !== 'string') return ElNotification({
        title: `文件类型错误`,
        message: h('i', { style: 'color: teal' },  `不支持的文件类型: ${lastFileData['file']['type']}`),
        type: 'error',
      })
    
    let data: Record<string, string> = {}

    if(type === 'json') {
      data = JSON.parse(lastFileData['fileContent'])
    }

    if(type === 'xml') {
      const result = await parserData(type, lastFileData['fileContent'])
      console.log('xml', result)
      data = result
    }

    if(type === 'xlsx') {
      // const result = await parserData(type, lastFileData['fileContent'])
      // data = result
      const data1 = new Uint8Array(lastFileData['fileContent']);
      const workbook = XLSX.read(data1, { type: 'array'});
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheet_to_json = XLSX.utils.sheet_to_json(sheet);
      data = xlsx2Json(sheet_to_json)
      console.log('workbook', data)
    }
    
    const name = lastFileData['file']['name'].split('.')[0]

    fileData.value = {
      type,
      data,
      name
    }

    setTimeout(() => {
      loading.close()
    }, 1000)
  }

  const parserData = async (fileType: 'xml' | 'xlsx', fileData: any) => {
    const { data, pending, error } = await useFetch(`/api/parser/${fileType}`, {
      method: "post",
      // headers: {
      //   'Content-Type': 'application/octet-stream'
      // },
      body: { fileData }
    })

    if (!error.value) {
      return data.value?.data || {}
    } else {
      console.log(error.value)
      return {}
    }
  }

  const classificationExport = async (fileType: FileListType['type']) => {
    switch (fileData.value.type) {
      case 'xlsx':
        for ( const item in fileData.value.data ) {
          await fileParse(fileData.value.data[item], item, fileType)
        }
        break;
      case 'json':
      case 'xml':
        await fileParse(fileData.value.data, fileData.value.name, fileType)
        break;
      default: 
        console.log('不支持的文件类型')
    }
    
  }

  const fileParse = async (fileData: any, fileName: string, fileType: FileListType['type']) => {
    const { data, pending, error } = await useFetch('/api/convert', {
      method: "post",
      body: {
        data: fileData,
        type: fileType
      }
    })
    if (!error.value) {
      exportFile({
        data: data.value?.data,
        name: fileName,
        type: fileType
      })
    } else {
      console.log(error.value)
    }
  }
</script>

<style lang="scss" scoped>
  .convert {
    height: 100%;
    &-contorl {
      display: flex;
      justify-content: flex-end;
    }

    &-section {
      margin-top: 20px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: calc(100% - 32px - 20px);
      &-upload {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }
</style>
