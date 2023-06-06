<template>
  <div class="index">
    <!-- <el-tabs v-model="activeTab" class="index-tabs" @tab-click="tabClick"> -->
      <!-- <el-tab-pane class="index-tabs-pane" v-for="item in languageList" :key="item.label" :label="item.label" :name="item.value"> -->
        <div class="index-control">
          <w-upload class="index-control-upload" type="button" :accept="accept" :fileUpload="fileUpload" />
          <el-dropdown class="index-control-export" :disabled="tableData.length === 0" split-button type="primary">
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
        </div>
        <!-- code list -->
        <el-table :data="tableData" stripe style="width: 100%" :row-class-name="tableRowClassName">
          <el-table-column label="Code" prop="code" fixed='left' />
          <template v-for="item in columns" :key="item.prop" >
            <el-table-column v-bind="item">
              <template #default="scope">
                <el-input :model-value="scope.row[item.prop]" @change="(e) => changeInput(e, scope.row, item)" />
              </template>
            </el-table-column>
          </template>
        </el-table>
      <!-- </el-tab-pane> -->
    <!-- </el-tabs> -->
    <w-diff v-if="Object.keys(diffArealyExistLangResult).length !== 0" :data="diffArealyExistLangResult" />
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import * as XLSX from 'xlsx';
  import type { Action } from 'element-plus'

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

  // const loading = ref(false)
  const languageList = ref<Record<string, string>[]>([])
  const activeTab = ref()
  const tableData = ref<Record<string, string>[]>([])
  const columns = ref<Record<string, string>[]>([])
  const accept = ref(initAccept)
  const exportFileTypeList = ref<Record<string, FileListType['type']>[]>(initExportFileTypeList)
  const diffArealyExistLangResult = ref<Record<string, any>>({})
  const diffDialogVisible = ref(false)

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

  const tableRowClassName = ({
    row,
    rowIndex,
  }: {
    row: Record<string, string>
    rowIndex: number
  }) => {
    // 翻译内容为空时, 表格置为警告颜色
    for (const item in row) {
      if(!row[item] || row[item].length === 0) {
        return 'warning-row'
      }
    }
    return ''
  }

  const changeInput = (text: string, row: Record<string, string>, item: Record<string, string>) => {
    console.log(text, row, item)
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
          exportFile({data: standerdJson[item], name: item, type: fileType})
        }
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
      console.log('所有 code 均相同, 开始合并文件！')
    }
  }

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
      console.log(`${lang} 语言新文件与改语言已有文件完全相同，无需进行覆盖确认！`)
    }
  }
</script>

<style lang="scss" scoped>
  .index {
    &-control {
      display: flex;
      justify-content: flex-end;
      &-upload,&-export {
        margin: 0 5px;
      }
    }
    &-tabs {
      &-pane {
        &-upload {
          float: right;
        }
        ::v-deep(.el-table .warning-row) {
          --el-table-tr-bg-color: var(--el-color-warning-light-9);
        }
        
      }
    }
    
  }

  
</style>
