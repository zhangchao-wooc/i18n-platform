<template>
  <div class="index">
    <el-tabs v-model="activeTab" class="index-tabs" @tab-click="tabClick">
      <el-tab-pane class="index-tabs-pane" v-for="item in languageList" :key="item.label" :label="item.label" :name="item.value">
        <w-upload class="index-tabs-pane-upload" type="button" :fileUpload="fileUpload" />
        <!-- code list -->
        <el-table :data="tableData" style="width: 100%" :row-class-name="tableRowClassName">
          <el-table-column label="Code" prop="code" fixed='left' />
          <template v-for="item in columns" :key="item.prop" >
            <el-table-column v-bind="item">
              <template #default="scope">
                <el-input :model-value="scope.row[item.prop]" @change="(e) => changeInput(e, scope.row, item)"></el-input>
              </template>
            </el-table-column>
          </template>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import lodash from 'lodash-es'
  import type { TabsPaneContext, Column } from 'element-plus'

  const loading = ref(false)
  const languageList = ref<Record<string, string>[]>([])
  const activeTab = ref()
  const tableData = ref<Record<string, string>[]>([])
  const columns = ref<Record<string, string>[]>([])

  onBeforeMount(async () => {
    queryLanguageList()
  })

  const tabClick = (pane: TabsPaneContext, ev: Event) => {
    activeTab.value = pane.paneName
  }

  const queryLanguageList = async () => {
    const loading = ElLoading.service({
      lock: true,
      text: 'Loading',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    const { data, pending, error } = await useFetch('/api/language', {
      query: { app: 'default' }
    })

    if(!error.value && !pending.value) {
      languageList.value = data?.value?.languageList || []
      activeTab.value = languageList.value[0].value || null
      loading.close()
    }

    if(error.value) {
      const { message, statusCode = 0} = error.value
      console.log(error)
      ElNotification({
        title: `错误 code: ${statusCode}`,
        message: h('i', { style: 'color: teal' }, message.toString()),
        type: 'error',
      })
      loading.close()
    }
  }

  const fileUpload = (file: any) => {
    let dataIndex = 0

    for (const item of file) {
      console.log(item)
      const fielData = JSON.parse(item['fileContent'])
      const fileName = item['file']['name'].split('.')[0]
      const fileNameIndex = columns.value.findIndex((item: Record<string, string>) => item.label === fileName )

      // 如果该语言不存在，则新增
      if (fileNameIndex === -1) {
        columns.value.push({
          label: fileName,
          prop: fileName
        })
      }

      // 文件内容转为 table 数据格式
      for (const children in fielData) {
        if (lodash.isObject(tableData.value[dataIndex])) {
          tableData.value[dataIndex][fileName] = fielData[children]
        } else {
          tableData.value[dataIndex] = {}
          tableData.value[dataIndex]['code'] = children
          tableData.value[dataIndex][fileName] = fielData[children]
        }
        dataIndex++
      }
      dataIndex = 0
    }
    console.log(columns.value.length)
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

</script>

<style lang="scss" scoped>
  .index {
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
