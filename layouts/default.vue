<template>
  <div class="layout">
    <el-container>
      <el-header>
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          :ellipsis="false"
          @select="handleSelect"
        >
          <el-menu-item index="0" class="layout-logo">I18n Platform</el-menu-item>
          <div class="flex-grow" />
          <el-menu-item index="1">Processing Center</el-menu-item>
          <el-sub-menu index="2">
            <template #title>Workspace</template>
            <el-menu-item index="2-1">item one</el-menu-item>
            <el-menu-item index="2-2">item two</el-menu-item>
            <el-menu-item index="2-3">item three</el-menu-item>
            <el-sub-menu index="2-4">
              <template #title>item four</template>
              <el-menu-item index="2-4-1">item one</el-menu-item>
              <el-menu-item index="2-4-2">item two</el-menu-item>
              <el-menu-item index="2-4-3">item three</el-menu-item>
            </el-sub-menu>
          </el-sub-menu>
        </el-menu>
      </el-header>

      <el-main><slot /></el-main>

      <el-footer>
        <div class="el-footer-title">友情链接</div>
        <div>
          <a class="el-footer-item" href="https://mini-i18n.wooc.top" target="_blank">mini-i18n</a>
        </div>
        
      </el-footer>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  const activeIndex = ref('1')  
  const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
  }

  onMounted(() => {
    // console.log(123)
    // const header = document.querySelector('.el-header')
    // const footer = document.querySelector('.el-footer')
    // const main = document.querySelector('.el-main')
    // console.log(header.style)
    // main.style.height = `calc(100vh - ${header.style.height} - ${footer.style.height})`



  })
</script>

<style scoped lang="scss">
  .layout {
    &-logo {
      font-size: 25px;
    }
    .flex-grow {
      flex-grow: 1;
    }

    .el-main {
      height: calc(100vh - 120px)
    }

    .el-footer {
      padding: 10px;
      display: flex;
      flex-direction: column;
      color: #fff;
      background-color: #000;
      &-title {
        flex: 1;
      }
      &-item {
        color: #fff;
        text-decoration: none;
      }
    }
  }
  
</style>
