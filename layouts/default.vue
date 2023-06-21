<template>
  <div class="layout">
    <el-container>
      <el-header>
        <h1 class="layout-logo"><a href="/">多语言管理平台</a></h1>
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          :ellipsis="false"
          @select="handleSelect"
        >
          <template v-for="item in menuList">
            <el-menu-item v-if="!item.children" :index="item.index">
              <NuxtLink :to="item.path">{{ item.label }}</NuxtLink>
            </el-menu-item>
            <template v-else>
              <el-sub-menu :index="item.index">
                <template #title>{{ item.label }}</template>
                <el-menu-item v-for="child in item.children" :index="child.index">
                  <NuxtLink :to="child.path">{{ child.label }}</NuxtLink>
                </el-menu-item>
              </el-sub-menu>
            </template>
          </template>
        </el-menu>
      </el-header>

      <el-main><slot /></el-main>

      <!-- <el-footer>
        <div class="el-footer-title">友情链接</div>
        <div>
          <a class="el-footer-item" href="https://mini-i18n.wooc.top" target="_blank">mini-i18n</a>
        </div>
      </el-footer> -->
    </el-container>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  interface MenuListType {
    index: string
    label: string
    path: string
    children?: MenuListType[]
  }

  const menuList = ref<MenuListType[]>([
    {
      index: '1',
      label: '首页',
      path: '/'
    },
    {
      index: '2',
      label: 'Diff',
      path: '/diff'
    },
    {
      index: '3',
      label: '格式转换',
      path: '/convert'
    },
    // {
    //   index: '3',
    //   label: 'Diff',
    //   path: '/diff',
    //   children: [
    //     {
    //       index: '3-1',
    //       label: 'Diff1',
    //       path: '/diff'
    //     }
    //   ]
    // }
  ])
  const activeIndex = ref('1')

  const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
    const menu = menuList.value.filter(item => {
      if(item.children && item.children.length > 0) {
        for(const child of item.children) {
          return child.index == key
        }
      }
        return item.index === key
    })
    if(menu.length === 0) return

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
    width: 100%;
    height: 100%;
    .el-container {
      width: 100%;
      height: 100vh;
    }
    .el-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .el-menu {
        border: none;
      }
    }
    &-logo {
      font-size: 25px;
      cursor: pointer;
      a {
        color: #000;
      }
    }
    .flex-grow {
      flex-grow: 1;
    }

    .el-main {
      padding: 0;
      width: 100%;
      height: 100%;
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
