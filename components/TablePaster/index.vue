<template>
  <div
    v-if="isSimple && showUpload"
    class="simple-paster xs-flex xs-flex-col-center xs-cursor-pointer"
    :style="{
      ...wrapperStyle,
      '--simpleUploadColor': simpleUploadColor,
      '--simplePasteColor': simplePasteColor
    }"
  >
    <el-tooltip
      v-if="!isSmallSimple && !isHideSimpleUpload"
      popper-class="guide-popper"
      :offset="0"
      :show-after="300"
      placement="top"
    >
      <template #content>
        <div
          v-if="picList.length"
          class="guide-btn"
          :style="{
            '--guideBtnColor': btnBgColor
          }"
          @click="picturePreviewShow"
        >
          <!-- <i class="icon-start"></i> -->
          操作指南
        </div>
        <span>{{ reportUrl }}</span>
      </template>
      <i class="icon-explain"></i>
    </el-tooltip>
    <div
      v-if="!isHideSimpleUpload"
      class="simple-paster_upload"
      :class="{ disabled }"
      @click="onUpload"
    >
      <i v-if="isSmallSimple" class="icon-upload"></i>
      <span v-else>上传报表</span>
    </div>
    <div
      v-if="!isHideSimplePaste"
      class="simple-paster_paste"
      :class="{ disabled }"
      @click="onPasteHandler"
    >
      <i v-if="isSmallSimple" class="icon-fuzhiniantie"></i>
      <span v-else>粘贴数据</span>
      <!-- <textarea @paste="onPaste"></textarea> -->
    </div>
  </div>
  <div v-if="!isSimple" class="table-paster" :style="wrapperStyle">
    <p v-if="topTipFirstLine" class="no-data-tips">
      {{ topTipFirstLine }}
      <br v-if="topTipSecondLine" />
      {{ topTipSecondLine }}
    </p>
    <div style="text-align: center; margin-top: 16px">
      <XSButton
        v-if="showUpload"
        class="paste-data-btn"
        normal
        :disabled="disabled"
        :style="{
          '--color': btnTextColor,
          '--backgroundColor': btnBgColor,
          '--hoverColor': hoverBgColor
        }"
        @click="onPasteHandler"
      >
        <i class="icon-fuzhiniantie"></i>
        粘贴数据
      </XSButton>
      <!-- <textarea @paste="onPaste"></textarea> -->
    </div>
    <p class="no-data-path">
      {{ reportUrl }}
    </p>
    <div class="operations">
      <span
        v-if="picList.length"
        class="operation-btn"
        :class="{ 'right-line': showUpload }"
        @click="picturePreviewShow"
      >
        <!-- <i class="icon-start"></i> -->
        操作指南
      </span>
      <span
        v-if="showUpload"
        class="operation-btn underline"
        :class="{ disabled }"
        @click="onUpload"
      >
        上传报表
      </span>
    </div>
  </div>
  <PicturePreview ref="picturePreviewRef" :pic-list="picList" />
  <div style="display: none">
    <input
      ref="uploadRef"
      type="file"
      accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      class="uploader"
      :multiple="false"
      @change="onChange"
    />
  </div>
</template>

<script setup>
  import { ref, defineExpose } from 'vue';
  import { usePaste } from './hooks/usePaste';
  import PicturePreview from '@/components/PicturePreview.vue';

  const props = defineProps({
    // 顶部第一行提示语
    topTipFirstLine: {
      type: String,
      default: ''
    },
    // 顶部第二行提示语
    topTipSecondLine: {
      type: String,
      default: ''
    },
    // 报表下载路径提示
    reportUrl: {
      type: String,
      default: ''
    },
    // 提示图片列表
    picList: {
      type: Array,
      default: () => []
    },
    // 粘贴数据切割成两个表格的表头字段
    sliceTableKey: {
      type: String,
      default: ''
    },
    fieldObj: {
      type: Object,
      default: () => ({})
    },
    isSimple: {
      type: Boolean,
      default: false
    },
    isSmallSimple: {
      type: Boolean,
      default: false
    },
    isHideSimpleUpload: {
      type: Boolean,
      default: false
    },
    isHideSimplePaste: {
      type: Boolean,
      default: false
    },
    showUpload: {
      type: Boolean,
      default: true
    },
    toExcel: {
      type: Boolean,
      default: false
    },
    simpleUploadColor: {
      type: String,
      default: '#fff'
    },
    simplePasteColor: {
      type: String,
      default: '#000'
    },
    btnTextColor: {
      type: String,
      default: '#fff'
    },
    btnBgColor: {
      type: String,
      default: '#3d6dda'
    },
    hoverBgColor: {
      type: String,
      default: '#2351b9'
    },
    wrapperStyle: {
      type: Object,
      default: () => ({})
    },
    disabled: Boolean,
    // 调用组件内的file input上传
    doUpload: {
      type: [Function, undefined],
      default: undefined
    },
    // 默认使用内部粘贴方法
    useInnerPaste: {
      type: Boolean,
      default: true
    }
  });

  const emits = defineEmits(['upload', 'paste', 'pasteHandler']);

  const uploadRef = ref();

  const picturePreviewRef = ref();

  const onChange = async () => {
    await props.doUpload([...(uploadRef.value?.files || [])]);
    uploadRef.value.value = '';
  };

  const picturePreviewShow = () => {
    picturePreviewRef.value && picturePreviewRef.value.show();
  };

  const onUpload = () => {
    if (props.disabled) {
      return;
    }
    if (props.doUpload) {
      uploadRef.value?.click();
    }
    emits('upload');
  };

  const pasteCallback = (result, splitArr) => {
    emits('paste', result, splitArr);
  };

  const { onPaste } = usePaste(props, pasteCallback);

  const onPasteHandler = () => {
    if (props.useInnerPaste) {
      onPaste();
      return;
    }
    emits('pasteHandler', onPaste);
  };
  defineExpose({
    onPaste
  });
</script>

<style lang="scss" scoped>
  .table-paster {
    position: absolute;
    top: 32px;
    left: 0;
    width: 100%;
    height: 320px;
    background: #fafafb;
    padding: 75px 75.5px;
    background: rgba(0, 0, 0, 0.1);
    text-align: center;

    .disabled {
      cursor: not-allowed !important;
    }

    .paste-data-btn {
      height: 48px !important;
      font-size: 18px !important;
      margin-bottom: 12px;
      padding: 12px 28px !important;
      color: var(--color);
      background-color: var(--backgroundColor);
      border: none;
      &:not(.is-disabled):hover {
        color: var(--color);
        background: var(--hoverColor) !important;
        border: none;
      }

      > .icon-fuzhiniantie {
        font-size: 24px;
        margin-right: 8px;
      }
    }

    .operations {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 12px;
      .operation-btn {
        color: #595959;
        cursor: pointer;
        font-size: 14px;
        line-height: 12px;
        padding: 0 12px;
      }

      .right-line {
        border-right: 1px solid #595959;
      }
      .underline {
        text-decoration: underline;
      }
    }

    p {
      text-align: center;
      &.no-data-tips {
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
        margin-bottom: 16px;
      }
      &.no-data-path {
        display: inline-block;
        padding: 0 4px;
        min-height: 30px;
        background: #fffbcc;
        text-align: center;
        border: 1px dashed #d4dbe9;
        border-radius: 2px;
        margin: 0 auto;
        font-size: 14px;
        line-height: 28px;
        color: #3d6dda;
      }
    }
  }
  .simple-paster {
    font-size: 12px;
    height: 20px;
    opacity: 0.65;
    .icon-explain {
      margin-right: 8px;
      color: var(--simpleUploadColor);
    }
    &_upload {
      height: 20px;
      line-height: 20px;
      color: var(--simpleUploadColor);
      margin-right: 8px;
    }
    &_paste {
      height: 20px;
      line-height: 20px;
      padding: 0 4px;
      border-radius: 1px;
      color: var(--simplePasteColor);
      background: rgba(255, 255, 255);
    }
    &_paste.disabled,
    &_upload.disabled {
      cursor: not-allowed;
    }
  }
  .guide-popper {
    padding: 16px;
    width: 280px;
    .guide-btn {
      // color: #339eff !important;
      color: var(--guideBtnColor) !important;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      cursor: pointer;
      i {
        margin-right: 4px;
      }
    }
  }
</style>
