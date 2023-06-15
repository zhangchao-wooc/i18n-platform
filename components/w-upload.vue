<template>
  <div class="w-upload">
    <el-button type="primary" class="w-upload-button" @click="handleUpload">
      {{ props.buttonText }}
      <el-icon  class="w-upload-button-icon"><UploadFilled /></el-icon>
    </el-button>
    
    <ul v-if="props.uploadList" class="w-upload-list">
      <el-tag
        class="w-upload-list-item"
        v-for="item in fileList"
        :key="item.file.lastModified"
        closable
        :type="item.type"
      >
      {{ item.file.name }}
      </el-tag>
    </ul>
    <input ref="upload" class="w-upload-input" type="file" :accept="props.accept" />
  </div>

  
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { ButtonProps } from 'element-plus'

  const props = defineProps({
    type: {
      type: String,
      default: 'button'
    },
    buttonText: {
      type: String,
      default: '上传'
    },
    multiple: {
      type: Boolean,
      default: false
    },
    accept: {
      type: String,
    },
    fileUpload: {
      type: Function,
      required: true
    },
    uploadList: {
      type: Boolean,
      default: false
    }
  })

  const inputFileProps = computed(() => {
    return {
      multiple: props.multiple,
      accept: props.accept
    }
  })

  const fileList = ref<any[]>([])
  const upload = ref(null)

  onMounted(async () => {
    // 获取上传文件的 input 元素
    const fileInput = document.querySelector('.w-upload');

    // 当用户选择文件时，触发该函数
    fileInput?.addEventListener('change', (event: any) => {
      // 获取用户选择的文件
      const file = event.target.files[0];
    
      // 创建 FileReader 对象
      const fileReader = new FileReader();
    
      // 当 FileReader 完成读取文件时，触发该函数
      fileReader.addEventListener('load', (event: any) => {
        // 读取文件的内容
        const fileContent = event.target.result;
        fileList.value.push({ file, fileContent })
        // 在控制台输出文件内容
        // console.log(fileList.value);
        props.fileUpload([{ file, fileContent }])
      });

      const suffix = file.name.split('.')[1]
      
      // 开始读取文件
      if (suffix === 'xlsx') {
        fileReader.readAsArrayBuffer(file)
      } else {
        fileReader.readAsText(file);
      }
      
      // fileReader.readAsText(file, 'utf-8');
      
    });
  })

  const handleUpload = () => {
    //@ts-ignore
    upload.value.click()
  }
</script>

<style lang="scss" scoped>
  .w-upload {
    position: relative;
    &-button {
      position: relative;
      &-icon {
        padding: 0 0 0 5px;
      }
    }
    &-input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    &-list {
      position: absolute;
      top: 40px;
      right: 0;
      margin: 5px 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      &-item {
        margin: 2px 0;
        list-style: none;
        animation: ease-in 0.3s;
        transition: all 0.3s ease-in;
      }
    }
  }
</style>
