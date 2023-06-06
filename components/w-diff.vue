<template>
  <div class="w-diff">
    <el-dialog
      v-model="dialogVisible"
      title="Diff 结果"
      width="80%"
      :before-close="handleClose"
    >
      <template #header>
        <el-select v-model="exportDiffType" class="w-diff-dialog-select" placeholder="请选择导出的 Diff 数据类型">
          <el-option v-for="item in exportDiffTypeList" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>

        <el-select v-model="exportFileType" class="w-diff-dialog-select" placeholder="请选择导出的文件类型">
          <el-option v-for="item in exportFileTypeList" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>

        <el-button type="primary" class="w-diff-upload-export" @click="exportFileToLocal">
          导出 diff
          <el-icon  class="w-diff-upload-button-icon"><Folder /></el-icon>
        </el-button>
      </template>
      
      <el-tabs v-model="activeTab" class="w-diff-dialog-tabs" @tab-click="tabClick">
        <el-tab-pane class="w-diff-dialog-tabs-pane" v-for="lang in Object.keys(diffResult)" :key="lang" :label="lang" :name="lang">
          <div class="w-diff-dialog-info">
            <div class="w-diff-dialog-info-item" v-for="item in Object.keys(diffResult[lang])" :key="item">
              {{ exportDiffTypeList.filter(d => d.value === item)[0].label }} : {{ diffResult[lang][item].length }}
            </div>
          </div>
          <!-- <el-input v-model="() => {
            return ref(JSON.stringify(JSON.parse(diffResult)[lang]))
          }" autosize type="textarea" /> -->
          <div>{{ JSON.stringify(diffResult[lang], null, 4) }}</div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  const props = defineProps({
    visiable: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: {}
    }
  })

  onMounted(() => {
    const list = Object.keys(props.data)
    // console.log(props.data[])
    activeTab.value = list[0]
    diffResult.value = props.data
  })

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
  
  const activeTab = ref()
  const diffResult = ref<Record<string, any>>({})
  const dialogVisible = ref(true)
  const exportFileType = ref('.json')
  const exportFileTypeList = ref<Record<string, string>[]>(initExportFileTypeList)
  const exportDiffType = ref<'add' | 'remove' | 'change' | 'empty' | 'all'>('add')
  const exportDiffTypeList = ref<Record<string, string>[]>(initExportDiffTypeList)

  const tabClick = (pane: any, ev: Event) => {
    activeTab.value = pane
  }

  const exportFileToLocal = async () => {
    const { data, pending, error } = await useFetch('/api/convert', {
      method: "post",
      body: {
        data: diffResult.value,
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

  const handleClose = () => {
    dialogVisible.value = false
  }
</script>

<style lang="scss" scoped>
  .w-diff {
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
