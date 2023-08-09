<template>
  <div class="index">
    <header class="index-header">
      <div class="index-header-left">
        <el-button type="primary" class="index-header-left-item" @click="back">返回</el-button>
        <!-- <el-popconfirm :title="`确认删除 ${selectionList.length} 条 code ?`" confirm-button-text="确认" cancel-button-text="取消" @confirm="batchDelete">
          <template #reference>
            <el-button type="primary" :disabled="selectionList.length === 0" >批量删除</el-button>
          </template>
        </el-popconfirm> -->
      </div>
    
      <div class="index-header-control">
        <el-button type="primary"  @click="editCodeDialogOpen(false)">添加 code</el-button>
        <el-button type="primary"  @click="deleteLanguageDialogVisible = true">删除语言</el-button>
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

    <section class="index-section">
      <div class="index-section-control">
        <el-collapse>
          <el-collapse-item title="应用详情" name="1">
            <div class="index-header-left-item">
              <b>应用名称：</b>
              <span>{{ appInfo?.name || '-'}}</span>
            </div>
            <div  class="index-header-left-item">
              <b>多语言版本：</b>
              <span>{{ appInfo?.version || '-'}}</span>
            </div>
            <div  class="index-header-left-item">
              <b>词条总数：</b>
              <span>{{ tableData.length }}</span>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      <!-- code list -->
      <DynamicScroller
        :items="tableData"
        :min-item-size="54"
        key-field="code"
        class="index-section-scroller"
      >
        <template #before>
          <div class="index-section-scroller-header">
            <div>code</div>
            <template v-for="column in columns" :key="column.label">
              <div>{{ column.label }}</div>
            </template>
          </div>
        </template>
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              item.code,
            ]"
            :data-index="index"
          >
            <div class="index-section-scroller-item">
              <div class="index-section-scroller-item-cell">{{ item['code'] }}</div>
              <template v-for="column in columns" :key="column.label">
                <div class="index-section-scroller-item-cell"  v-if="item[column.prop]?.length === 0 ">
                  <el-icon><WarningFilled class="cell-warning"/></el-icon>
                </div>
                <div v-else class="index-section-scroller-item-cell">{{ item[column.prop] }}</div>
                <!-- <el-input style="flex: 1" type="textarea" :model-value="item[column.prop]" autosize @input="(e) => changeInput(e, scope.row, item)" /> -->
              </template>
              <div class="index-section-scroller-item-handle">
                <el-popconfirm title="确认删除?" confirm-button-text="确认" cancel-button-text="取消" @confirm="handleTable('DELETE', index)">
                  <template #reference>
                    <el-button type="danger" size="small"><el-icon><Delete /></el-icon></el-button>
                  </template>
                </el-popconfirm>
                <el-button type="primary" size="small" @click="editCodeDialogOpen(true, item)"><el-icon><Edit /></el-icon></el-button>
              </div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </section>

    <w-diff v-if="Object.keys(diffArealyExistLangResult).length !== 0" :data="diffArealyExistLangResult" />
    <w-translate v-if="batchTranslateDialogVisible" :cb="batchTranslateCb" :data="tableData" />

    <!-- edit code -->
    <el-dialog :model-value="codeDialogFormVisible" :title="`${isEditCode ? '编辑' : '新增' } code`" width="800" @close="editCodeDialogClose(codeRuleFormRef)">
      <el-form :model="codeForm" :rules="codeFormrules" ref="codeRuleFormRef">
        <el-form-item label="code" :label-width="formLabelWidth" prop="code">
          <el-input type="textarea" autosize v-model="codeForm.code" :disabled="isEditCode"/>
        </el-form-item>
        <el-form-item :label="item.label" :label-width="formLabelWidth" :prop="item.prop" v-for="item in columns" :key="item.label">
          <el-input type="textarea" autosize v-model="codeForm[item.prop]" />
        </el-form-item>
        <el-form-item>
          <template style="width: 100%; display: flex; justify-content: center;">
            <el-button type="primary" @click="editCode(codeRuleFormRef)">提交</el-button>
            <el-button @click="editCodeDialogClose(codeRuleFormRef)">取消</el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- delete language | table column -->
    <el-dialog :model-value="deleteLanguageDialogVisible" title="删除语言" width="400" @close="deleteLanguageDialogClose">
      <el-select v-model="selectedDeleteLangList" placeholder="请选择要删除的语言" multiple clearable style="width: 100%">
        <el-option v-for="item in columns" :key="item.label" :label="item.label" :value="item.prop" />
      </el-select>
      <template #footer>
        <el-popconfirm title="确认删除?" confirm-button-text="确认" cancel-button-text="取消" @confirm="deleteLang">
          <template #reference>
            <el-button type="primary">确定删除</el-button>
          </template>
        </el-popconfirm>
       </template>
    </el-dialog>
    <el-backtop :right="50" :bottom="50" style="z-index: 100"/>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue'
  import * as XLSX from 'xlsx';
  import type { Action } from 'element-plus'
  import CryptoJS from 'crypto-js'
  import * as propertiesParse from 'properties-parser'
  import type { FormInstance, FormRules } from 'element-plus' 

  interface FileListType {
    data: Record<string, string>
    type: 'xml' | 'xlsx' | 'json' | 'properties'
    name: string
  }
  const fileTypeMap: Record<string, FileListType['type']> = {
    'application/json': 'json',
    'text/xml': 'xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  }
  const initAccept = '.xml,.json,.xlsx,.properties'
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
  const selectionList = ref<Record<string, string>[]>([])
  const accept = ref<string>(initAccept)
  const exportFileTypeList = ref<Record<string, FileListType['type']>[]>(initExportFileTypeList)
  const diffArealyExistLangResult = ref<Record<string, any>>({})
  const batchTranslateDialogVisible = ref<boolean>(false)
  const deleteLanguageDialogVisible = ref<boolean>(false)
  const selectedDeleteLangList = ref<string[]>([])
  const isEditCode = ref<boolean>(false)
  const codeDialogFormVisible = ref<boolean>(false)
  const formLabelWidth = '80px'
  const codeRuleFormRef = ref<FormInstance>()
  const codeForm = ref<Record<string, string>>({
    code: ''
  })
  const codeFormrules = reactive<FormRules>({
    code: [
      { required: true, message: '请输入', trigger: 'blur' }
    ]
  })

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
    const {data, code, message} = await $fetch(`/api/app/current`, {
      method: 'get',
      query: { uuid: appInfo.value.uuid }
    })
    loading.close()
    if(code === 200) {
      const { columns: resultClumns, tableData: resultTableData } = standerdJson2Table(data)
      columns.value = resultClumns
      tableData.value = resultTableData
      // tableData.value = []
      // let time = 0
      // for(const item of resultTableData) {
      //   setTimeout(() => {
      //     tableData.value.push(item)
      //   }, time)
      //   time += 1
      // }
      
      
    } else {
      ElMessage({ message, type: 'error' })
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
      const fileType = item['file']['name'].split('.')[1]
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
            console.log(standerdJson)
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
        case 'properties':
          const parserPropertiesResult = propertiesParse.parse(item['fileContent'])
          standerdJson[fileName] = parserPropertiesResult
          console.log('properties', standerdJson)
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
          // import language file is not exist, check code.
          // Diff between "table code" and "new File".
          mergeSameLangCheck(DiffMergeData(currentTable2StanderdJson[columns.value[0].prop], standerdJson[lang]), standerdJson, lang)
        } else {
          // if language is not exist, merge clumns and table data.
          mergeNewLangCheck(DiffEmptyValueCode(standerdJson[lang]), standerdJson, lang)
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
      body: { fileData }
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
        console.log(tableData.value)
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

    loading.close()
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
  const mergeSameLangCheck = (newDiffCodeResult: Record<string, any>, standerdJson: Record<string, any>, lang: string ) => {
    let addCodeLength = Object.keys(newDiffCodeResult.add).length
    let changeValueCodeLength = Object.keys(newDiffCodeResult.change).length
    let emptyValueCodeLength = Object.keys(newDiffCodeResult.empty).length

    if(addCodeLength === 0 && changeValueCodeLength === 0 && emptyValueCodeLength ===0) {
      console.log(`${lang} 文件 code 与已有 code 相同, 开始合并文件！`)
      const currentTable2StanderdJson = table2StanderdJson(tableData.value)
      currentTable2StanderdJson[lang] = standerdJson[lang]
      const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
      columns.value = resultClumns
      tableData.value = resultData
    } else {
      ElMessageBox.alert(
        `
          <div>
            <p>新增 code 数：${addCodeLength}</p>
            <p>code 值变更数：${changeValueCodeLength}</p>
            <p>code 值变为空数：${emptyValueCodeLength}</p>
            <pre style="padding: 10px; background: #000; color: #ccc">${JSON.stringify(newDiffCodeResult, null, 4)}</pre>
          </div>
        `, 
        '新文件 Code 变更如下， 是否合并 ？', 
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
              for(const code in newDiffCodeResult.change) {
                  currentTable2StanderdJson[lang][code] = newDiffCodeResult.change[code].newValue
                }
              const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
              columns.value = resultClumns
              tableData.value = resultData
            } else if( action === 'cancel') {
              // 放弃合并
            }
          },
        }
      )
    }

  }

  // Check and merge for new language file.
  const mergeNewLangCheck = (diffEmptyResult: Record<string, string>, standerdJson: Record<string, any>, lang: string) => {
    const resultLength = Object.keys(diffEmptyResult).length
    if(resultLength != 0) {
      ElMessageBox.alert(
        `
          <div>
            <h4>新文件空值校验</h4>
            <p>
              <span>空值数量：${diffEmptyResult.length}</span>
            </p>
            <pre style="padding: 10px; background: #000; color: #ccc">${JSON.stringify(diffEmptyResult, null, 4)}</pre>
          </div>
        `, 
        '新文件空值校验！', 
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
              ElMessage({ message: "已放弃合并", type: 'warning' })
            }
          },
        }
      )
    } else {
      console.log(`${lang} 新增语言无空置，直接合并！`)
      const currentTable2StanderdJson = table2StanderdJson(tableData.value)
      currentTable2StanderdJson[lang] = standerdJson[lang]
      const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
      columns.value = resultClumns
      tableData.value = resultData
    }
  }

  const handleTable = (handle: string, index: number, ) => {
    if (handle === 'DELETE') {
      tableData.value.splice(index, 1)
      ElMessage({ message: "删除成功", type: 'success' })
    }
  }

  const batchDelete = () => {
    const currentTable2StanderdJson = table2StanderdJson(tableData.value)
    const selectionStanderdJson = table2StanderdJson(selectionList.value)

    for(const lang in selectionStanderdJson) {
      for(const item in selectionStanderdJson[lang]) {
        Reflect.deleteProperty(currentTable2StanderdJson[lang], item)
      }
    }
    const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
    tableData.value = resultData
    ElMessage({ message: "删除成功", type: 'success' })
  }

  const editCodeDialogOpen = (isEdit: boolean, row?: Record<string, string>) => {
    codeDialogFormVisible.value = true
    isEditCode.value = isEdit
    
    if(isEdit && row) {
      codeForm.value = {...row}
    } else {
      codeForm.value = { code: ''}
    }
  }

  const editCode = async (formEl: FormInstance | undefined) => {
    console.log('editCode')
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
      if (valid) {
        const index = tableData.value.findIndex(item => item.code == codeForm.value.code.trim())
        if(isEditCode.value) {
          tableData.value[index] = {...codeForm.value}
        } else if(index === -1) {
          tableData.value.push({...codeForm.value})
        } else {
          ElMessage({ message: 'code 已存在，请重新输入！', type: 'warning' })
          return
        }

        ElMessage({ message: `${isEditCode.value ? '编辑' : '新增'} code 成功`, type: 'success' })
        editCodeDialogClose(formEl)
      }
    })
  }

  const editCodeDialogClose = (formEl: FormInstance | undefined) => {
    formEl?.clearValidate()
    codeDialogFormVisible.value = false
  }

  const batchTranslate = () => {
    batchTranslateDialogVisible.value = true
  }

  const deleteLang = () => {
    if(selectedDeleteLangList.value.length === 0) return ElMessage({ message: '请选择要删除的语言！', type: 'warning' })
    const currentTable2StanderdJson = table2StanderdJson(tableData.value)
    selectedDeleteLangList.value.forEach((item: string) => {
      Reflect.deleteProperty(currentTable2StanderdJson, item)
    })
    const {columns: resultClumns, tableData: resultData} = standerdJson2Table(currentTable2StanderdJson)
    tableData.value = resultData
    columns.value = resultClumns
    ElMessage({ message: `语言 ${selectedDeleteLangList.value.join(', ')} 删除成功`, type: 'success' })
    deleteLanguageDialogClose()
  }

  const deleteLanguageDialogClose = () => {
    selectedDeleteLangList.value = []
    deleteLanguageDialogVisible.value = false
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
      queryAppInfo(false)
      ElMessage({ message: '保存成功', type: 'success' })
    } else {
      ElMessage({ message, type: 'error' })
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
      ElMessage({ message: '发布成功', type: 'success' })
    } else {
      ElMessage({ message, type: 'error' })
    }
  }

  const back = () => {
    // checksum different, content changed, popup prompt.
    if(appInfo.value.checksum !== '' && contentChecksum.value !== appInfo.value.checksum) {
      ElMessageBox.alert(
        `<div>请保存或发布已更改的数据，若继续退出，将删除已有的更改！</div>`, 
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
            if( action === 'cancel') {
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
      top: 0px;
      padding: 10px 5px ;
      width: 100%;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      border-bottom: solid 1px var(--el-menu-border-color);
      background-color: #fff;
      box-sizing: border-box;
      z-index: 10;
      &-left {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        &-item {
          margin: 0 5px;
        }
      }
      &-control {
        flex-shrink: 0;
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

    &-section {
      &-control {
        position: sticky;
        top: 53px;
        padding: 0 10px;
        z-index: 10;
        background-color: #fff;
        box-sizing: border-box;
      }
      &-scroller {
        position: relative;
        padding: 0 10px 10px;
        font-size: 12px;
        overflow-x: auto;
        &-header {
          display: flex;
          font-size: 14px;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &::after {
            content: '';
            display: block;
            width: 84px;
          }
          div {
            flex: 1;
            min-width: 300px;
            align-content: center;
            padding: 10px 3px;
          }
        }
        &-item {
          
          padding: 10px 3px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--el-border-color-lighter);
          transition: all 0.3s;
          
          
          &:hover {
            background-color: var(--el-fill-color-light);
          }
          &-cell {
            flex: 1;
            min-width: 300px;
            padding: 0 5px;
            flex-shrink: 0;
            word-break:break-all;
            .cell-warning {
              color: var(--el-color-warning);
              font-size: 14px;
            }
          }
          &-handle {
            position: sticky;
            right: 0;
          }
          
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
