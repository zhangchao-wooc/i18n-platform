<template>
  <div class="index">
    <!-- <el-tabs v-model="activeTab" class="index-tabs" @tab-click="tabClick"> -->
      <!-- <el-tab-pane class="index-tabs-pane" v-for="item in languageList" :key="item.label" :label="item.label" :name="item.value"> -->
      <header class="index-header">
        <div class="index-header-left">
          <el-button type="primary"  class="index-header-left-item" @click="back">返回</el-button>
          <div class="index-header-left-item">
            <b>应用名称：</b>
            <span>{{ appInfo?.name || '-'}}</span>
          </div>
          <div  class="index-header-left-item">
            <b>多语言版本：</b>
            <span>{{ appInfo?.version || '-'}}</span>
          </div>
        </div>
      
        <div class="index-header-control">
          <div class="index-header-control-info">
            <span>词条总数：{{ tableData.length }}</span>
            <!-- <template v-for="item in columns" :key="item.label">
              <span>{{ item.label }} 空值数量： {{  }}</span>
            </template> -->
          </div>
          <w-upload class="index-header-control-upload" type="button" :accept="accept" :fileUpload="fileUpload" />
          <el-dropdown class="index-header-control-export" :disabled="tableData.length === 0" split-button type="primary">
            导出文件
            <template #dropdown>
              <el-dropdown-menu>
                <template v-for="item in exportFileTypeList" :key="item.value" >
                  <el-dropdown-item @click="classificationExport(item.value)">
                    <div >{{ item.label }}</div>
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" :disabled="tableData.length === 0" @click="batchTranslate">批量翻译</el-button>
          <el-button type="primary" :disabled="tableData.length === 0" @click="save">保存</el-button>
          <el-button type="primary" :disabled="tableData.length === 0" @click="publish">发布</el-button>

        </div>
      </header>
        <!-- code list -->
        <el-table :data="tableData" stripe style="width: 100%" :cell-class-name="tableCellClassName">
          <el-table-column  type="index" width="50" />
          <el-table-column type="selection" width="55" />
          <el-table-column label="Code" prop="code"  />
          <template v-for="item in columns" :key="item.prop" >
            <el-table-column v-bind="item">
              <template #default="scope">
                <el-input :model-value="scope.row[item.prop]" @input="(e) => changeInput(e, scope.row, item)" />
              </template>
            </el-table-column>
          </template>
          <el-table-column label="操作" prop="handle" width="85px" fixed='right'>
            <template #default="scope">
              <el-popconfirm title="确认删除?" confirm-button-text="确认" cancel-button-text="取消" @confirm="handleTable('DELETE', scope)">
                <template #reference>
                  <el-button type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      <!-- </el-tab-pane> -->
    <!-- </el-tabs> -->
    <w-diff v-if="Object.keys(diffArealyExistLangResult).length !== 0" :data="diffArealyExistLangResult" />
    <w-translate v-if="batchTranslateDialogVisible" :cb="batchTranslateCb" :data="tableData" />
    <el-backtop :right="100" :bottom="500" style="z-index: 100"/>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue'
  import * as XLSX from 'xlsx';
  import type { Action } from 'element-plus'
  import CryptoJS from 'crypto-js'

  interface FileListType {
    data: Record<string, string>
    type: 'xml' | 'xlsx' | 'json'
    name: string
  }
  const fileTypeMap: Record<string, FileListType['type']> = {
    'application/json': 'json',
    'text/xml': 'xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  }
  const initAccept = '.xml,.json,.xlsx'
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

  const appInfo = ref<Record<string, any>>({})
  const tableData = ref<Record<string, string>[]>([])
  const columns = ref<Record<string, string>[]>([])
  const accept = ref(initAccept)
  const exportFileTypeList = ref<Record<string, FileListType['type']>[]>(initExportFileTypeList)
  const diffArealyExistLangResult = ref<Record<string, any>>({})
  const batchTranslateDialogVisible = ref(false)

  const route = useRoute()

  onBeforeMount(() => {
    console.log('app-onBeforeMount')
    queryAppInfo(true)
  })

  // use sha1 real-time computing multilingual data, sure data whether change.
  const contentChecksum = computed(() => {
    const currentTable2StanderdJson = table2StanderdJson(tableData.value)
    return CryptoJS.SHA1(JSON.stringify(currentTable2StanderdJson)).toString()
  })

  const queryAppInfo = async (isQueryCurrentVersionData?: boolean) => {
    const {code, data, message} = await $fetch(`/api/app/info`, {
      method: 'get',
      query: { uuid: route.query.uuid }
    })
    
    if(code === 200) {
      appInfo.value = data
      isQueryCurrentVersionData && queryCurrentVersionData()
    } else {
      ElMessage({ message, type: 'error' })
    }
  }

  const queryCurrentVersionData = async () => {
    const loading = ElLoading.service({
      lock: true,
      text: '获取数据中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const {code, data, message} = await $fetch(`/api/app/current`, {
      method: 'get',
      query: { uuid: appInfo.value.uuid }
    })
    
    loading.close()

    if(code === 200) {
      const { columns: resultClumns, tableData: resultTableData } = standerdJson2Table(data)
      columns.value = resultClumns
      tableData.value = resultTableData
    } else {
      ElMessage({
        message,
        type: 'error',
      })
    }
  }

  const fileUpload = async (file: any) => {
    const loading = ElLoading.service({
      lock: true,
      text: '文件处理中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    for (const item of file) {
      const fileData = item['fileContent']
      const fileName = item['file']['name'].split('.')[0]
      const fileType: FileListType['type'] = fileTypeMap[item['file']['type']]
      if(!isString(fileType)) {
        return ElNotification({
          title: `文件类型错误`,
          message: h('i', { style: 'color: teal' },  `不支持的文件类型: ${item['file']['type']}`),
          type: 'error',
        })
      }

      let standerdJson: Record<string, any> = {}

      switch (fileType) {
        case 'json':
          const result = toStanderdJson(JSON.parse(fileData), fileName)
          if (isString(result)) {
            ElNotification({
              title: `文件类型错误`,
              message: h('i', { style: 'color: teal' },  result),
              type: 'error',
            })
          } else {
            //@ts-ignore
            standerdJson = result
          }
          break;
        case 'xml':
          const resultXml = toStanderdJson(await parserData(fileType, item['fileContent']), fileName)
          if (isString(resultXml)) {
            ElNotification({
              title: `文件类型错误`,
              message: h('i', { style: 'color: teal' },  resultXml),
              type: 'error',
            })
          } else {
            console.log('xml', resultXml)
            //@ts-ignore
            standerdJson = resultXml
          }
          break;
        case 'xlsx':
          const data1 = new Uint8Array(item['fileContent']);
          const workbook = XLSX.read(data1, { type: 'array'});
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const sheet_to_json = XLSX.utils.sheet_to_json(sheet);
          standerdJson = xlsx2Json(sheet_to_json)
          console.log('xlsx', standerdJson)
          break;
        default:
          ElNotification({
            title: `文件类型错误`,
            message: h('i', { style: 'color: teal' },  `不支持的文件类型: ${item['file']['type']}`),
            type: 'error',
          })
      }

      if(isObject(standerdJson)) {
        dealTableData(standerdJson)
      } else {
        ElNotification({
          title: `文件类型错误`,
          message: h('i', { style: 'color: teal' },  `标准 json 数据错误`),
          type: 'error',
        })
      }
    }

    setTimeout(() => { loading.close() }, 1000)
  }

  // merge table data
  const dealTableData = (standerdJson: Record<string, any>) => {
    for(const lang in standerdJson) {
      if(columns.value.length !== 0) {
        const currentTable2StanderdJson = table2StanderdJson(tableData.value)
        const langExist = columns.value.some(oldData => oldData.prop === lang)
        // import language file alrealy exist, record
        if (langExist) {
          /**
            * if language is not repeat, merge clumns and table data.
            *   Otherwise, display data differences.
            */
          mergeSameLangCheck(diffJson(currentTable2StanderdJson[lang], standerdJson[lang]), standerdJson, lang )
        } else {
          // import language file is not exist, check code
          // Diff between "table code" and "new File".
          mergeAddCodeCheck(diffCode(currentTable2StanderdJson[columns.value[0].prop], standerdJson[lang]), standerdJson, lang)
        }
      } else {
        const newTableData: Record<string, any> = {}
          newTableData[lang] = standerdJson[lang]
        const {columns: resultClumns, tableData: resultData} = standerdJson2Table(newTableData)
        columns.value = resultClumns
        tableData.value = resultData
      }
    }
  }

  const parserData = async (fileType: 'xml' | 'xlsx', fileData: any) => {
    const { data, pending, error } = await useFetch(`/api/parser/${fileType}`, {
      method: "post",
      // headers: {
      //   'Content-Type': 'application/octet-stream'
      // },
      body: fileData
    })

    if (!error.value) {
      return data.value?.data || {}
    } else {
      console.log(error.value)
      return {}
    }
  }

  const tableCellClassName = ({
    row, column, rowIndex, columnIndex
  }: {
    column: Record<string, string>
    row: Record<string, string>
    rowIndex: number
    columnIndex: number
  }) => {
    // when content is empty, current cell background color set warning color.
    if(column.property !== 'code' && column.property !== 'handle' && column.type !== "selection" && column.type !== "index") {
      if (!row[column.property]) {
        return 'warning-row'
      }
    }
    return ''
  }

  const changeInput = (text: string, row: Record<string, string>, item: Record<string, string>) => {
    console.log(text, row, item)
    row[item.prop] = text
  }

  const classificationExport = async (fileType: FileListType['type']) => {
    const loading = ElLoading.service({
      lock: true,
      text: '文件处理中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const standerdJson = table2StanderdJson(tableData.value)

    switch (fileType) {
      case 'xlsx':
        exportXlxsFile(tableData.value, 'i18n')
        break;
      case 'json':
        for ( const item in standerdJson ) {
          exportFile({data: JSON.stringify(standerdJson[item], null, 4), name: item, type: fileType})
        }
        break;
      case 'xml':
        for ( const item in standerdJson ) {
          await fileParse(standerdJson[item], item, fileType)
        }
        break;
      default:
        console.log('不支持的文件类型')
        break;
    }

    setTimeout(() => {
      loading.close()
    }, 1000)
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

  // check and merge "code" for language data
  const mergeAddCodeCheck = (newDiffCodeResult: Record<string, any>, standerdJson: Record<string, any>, lang: string ) => {
    let addCodeLength = Object.keys(newDiffCodeResult.add).length

    if (addCodeLength !== 0) {
      ElMessageBox.alert(
        `
          <div>
            <p>新增 code 总数：${addCodeLength}</p>
            <pre style="padding: 10px; background: #000; color: #ccc">${JSON.stringify(newDiffCodeResult, null, 4)}</pre>
          </div>
        `, 
        '上传文件新增 Code 如下， 是否合并 ？', 
        {
          showClose: false,
          customStyle: { maxWidth: '80vw' },
          dangerouslyUseHTMLString: true,
          closeOnClickModal: false,
          showCancelButton: true,
          confirmButtonText: '合并',
          cancelButtonText: "取消",
          callback: (action: Action) => {
            if ( action === 'confirm') {
              const currentTable2StanderdJson = table2StanderdJson(tableData.value)
              // exist languag data add empty for add 'code'
              for(const language in currentTable2StanderdJson) {
                for(const newCode in newDiffCodeResult.add) {
                  currentTable2StanderdJson[language][newCode] = ''
                }
              }
              currentTable2StanderdJson[lang] = standerdJson[lang]
              const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
              columns.value = resultClumns
              tableData.value = resultData
              console.log(resultData)
            } else if( action === 'cancel') {
              // 放弃合并
            }
          },
        }
      )
    } else {
      console.log(`${lang} 文件 code 与已有 code 相同, 开始合并文件！`)
      const currentTable2StanderdJson = table2StanderdJson(tableData.value)
      currentTable2StanderdJson[lang] = standerdJson[lang]
      const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
      columns.value = resultClumns
      tableData.value = resultData
    }
  }

  // check and merge for same language file 
  const mergeSameLangCheck = (diffJsonResult: Record<string, any>, standerdJson: Record<string, any>, lang: string) => {
    let resultLength = 0
    for(const item in diffJsonResult) {
      if(diffJsonResult[item].length !== 0) {
        resultLength += diffJsonResult[item].length
      }
    }
    if(resultLength != 0) {
      ElMessageBox.alert(
        `
          <div>
            <h4>新文件变更信息</h4>
            <p>
              <span>删除数量：${diffJsonResult['remove'].length}</span>
              <span>新增数量：${diffJsonResult['add'].length}</span>
              <span>变更数量：${diffJsonResult['change'].length}</span>
              <span>空值数量：${diffJsonResult['empty'].length}</span>
            </p>
            <pre style="padding: 10px; background: #000; color: #ccc">${JSON.stringify(diffJsonResult, null, 4)}</pre>
          </div>
        `, 
        '上传的语言类别已存在，新数据与已有数据区别如下，请选择操作！', 
        {
          showClose: false,
          customStyle: { maxWidth: '80vw' },
          dangerouslyUseHTMLString: true,
          closeOnClickModal: false,
          showCancelButton: true,
          confirmButtonText: '合并',
          cancelButtonText: "取消",
          callback: (action: Action) => {
            if ( action === 'confirm') {
              const currentTable2StanderdJson = table2StanderdJson(tableData.value)
              currentTable2StanderdJson[lang] = standerdJson[lang]
              const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
              columns.value = resultClumns
              tableData.value = resultData
            } else if( action === 'cancel') {
              // 放弃合并
            }
          },
        }
      )
    } else {
      console.log(`${lang} 语言新文件与该语言已有文件完全相同，无需进行覆盖确认！`)
    }
  }

  const handleTable = (handle: string, data: any, ) => {
    console.log('handleTable', data, handle)
    if (handle === 'DELETE') {
      tableData.value.splice(data.$index, 1)
    } else if (handle === 'ADD') {
      tableData.value.push(data)
    }
    
  }

  const batchTranslate = () => {
    batchTranslateDialogVisible.value = true
  }

  const batchTranslateCb = (translateResult?: Record<string, any>) => {
    if (translateResult) {
      console.log('merge', translateResult)
      // if translate result is exist, merge to table data.
      for(const lang in translateResult) {
        const currentTable2StanderdJson = table2StanderdJson(tableData.value)
        currentTable2StanderdJson[lang] = translateResult[lang]
        const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
        columns.value = resultClumns
        tableData.value = resultData
      }
    }
    batchTranslateDialogVisible.value = false
  }

  const save = async () => {
    if(contentChecksum.value === appInfo.value.checksum) {
      ElMessageBox.alert('内容未更改，不可保存！', '提示', {
        confirmButtonText: '好的',
      })
      return
    }
    const loading = ElLoading.service({
      lock: true,
      text: '保存中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const {code, data, message} = await $fetch(`/api/app/save`, {
      method: 'POST',
      body: {
        uuid: route.query.uuid,
        data: JSON.stringify(table2StanderdJson(tableData.value))
      }
    })
    
    loading.close()

    if(code === 200) {
      ElMessage({
        message: '保存成功',
        type: 'success',
      })
    } else {
      ElMessage({
        message,
        type: 'error',
      })
    }
  }

  const publish = async () => {
    if(contentChecksum.value === appInfo.value.checksum) {
      ElMessageBox.alert('内容未更改，不可发布！', '提示', {
        confirmButtonText: '好的',
      })
      return
    }
    const loading = ElLoading.service({
      lock: true,
      text: '发布中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const {code, data, message} = await $fetch(`/api/app/publish`, {
      method: 'POST',
      body: {
        uuid: route.query.uuid,
        data: JSON.stringify(table2StanderdJson(tableData.value))
      }
    })
    
    loading.close()

    if(code === 200) {
      queryAppInfo(false)
      ElMessage({
        message: '发布成功',
        type: 'success',
      })
    } else {
      ElMessage({
        message,
        type: 'error',
      })
    }
  }

  const back = () => {
    // checksum different, content changed, popup prompt.
    if(contentChecksum.value !== appInfo.value.checksum) {
      ElMessageBox.alert(
        `
          <div>
            请保存或发布已更改的数据，若继续退出，将删除已有的更改！
          </div>
        `, 
        '提示', 
        {
          showClose: false,
          customStyle: { maxWidth: '80vw' },
          dangerouslyUseHTMLString: true,
          closeOnClickModal: false,
          showCancelButton: true,
          confirmButtonText: '回去保存',
          cancelButtonText: "放弃更改",
          callback: (action: Action) => {
            if ( action === 'confirm') {

            } else if( action === 'cancel') {
              navigateTo({ path: '/'})
            }
          },
        }
      )
    } else {
      // checksum the same, content not changed.
      navigateTo({ path: '/'})
    }
  }

</script>

<style lang="scss" scoped>
  .index {
    &-header {
      position: sticky;
      top: -20px;
      padding: 20px 5px ;
      width: 100%;
      display: flex;
      justify-content: space-between;
      border-bottom: solid 1px var(--el-menu-border-color);
      background-color: #fff;
      z-index: 10;
      &-left {
        display: flex;
        align-items: center;
        &-item {
          margin: 0 5px;
        }
      }
      &-control {
        display: flex;
        justify-content: flex-end;

        &-info {
          display: flex;
          align-items: center;
          padding: 0 10px;
        }

        &-upload,&-export {
          margin: 0 5px;
        }
      }
    }
   
    &-tabs {
      &-pane {
        &-upload {
          float: right;
        }
      }
    }
    ::v-deep(.el-table .el-table__row .warning-row) {
      background-color: var(--el-color-warning-light-5)!important;
    }
  }
</style>
