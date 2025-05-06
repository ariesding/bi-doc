<template>
  <div class="el-input">
    <input
      ref="inputRef"
      v-model="numberT"
      class="el-input__inner self-input-number"
      placeholder=""
      @blur="onBlur"
    />
    <slot name="suffix"></slot>
  </div>
</template>

<script setup>
  import { nextTick, onMounted, ref, watch } from 'vue';

  const props = defineProps({
    value: { type: [String, Number], default: '' },
    integer: { type: Boolean, default: false }
  });

  const inputRef = ref();

  const emits = defineEmits(['update:value', 'onBlur']);

  const numberT = ref(props.value);
  const isInteger = ref(props.integer);

  const onBlur = () => {
    if (numberT.value || numberT.value === 0) {
      if (!isInteger.value)
        numberT.value = parseFloat(numberT.value).toFixed(2);
    }
    emits('onBlur');
  };

  watch(numberT, value => {
    if (value === null) {
      numberT.value === null;
    } else if (value) {
      let val = value.replace(/[^\d.-]/g, ''); //清除"数字"、"."和"-"以外的字符
      val = val.replace(/^\./g, ''); // 第一个不可以输入小数点
      if (!/^[^-]*-?[^-]*$/.test(val)) val = val.substring(val, val.length - 1); // 不可以输入第二个"-"
      if (isInteger.value) {
        val = val.replace(/\.{1,}/g, ''); // 整数不可以输入小数点
        // 可以填入0，但是不可以填入0开头的多位数字
        if (/^0/g.test(val) && val.length >= 2) val = val.replace(/^0/g, ''); // 整数第一个数字不可以输入0
        // 负数处理
        if (/^-0/g.test(val) && val.length >= 2) {
          val = val.replace(/^-0/g, '');
        }
      } else {
        // 小数第一个输入0后必须接小数点
        if (/^0/g.test(val) && val.length >= 2 && !/^0\./g.test(val)) {
          val = val.replace(/^0/g, '');
        }
        // 负数处理
        if (/^-0/g.test(val) && val.length >= 3 && !/^-0\./g.test(val)) {
          val = val.replace(/^-0/g, '');
        }
        val = val.replace(/\.{2,}/g, '.'); // 非整数只保留第一个.清除多余的
        if (val.split('.')[0].length > 3) {
          const [integer, decimals] = val.split('.');
          val = integer.substr(0, 3) + (decimals ? '.' + decimals : '');
        }
      }
      val = val.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
      val = val.replace(/^(-)*(\d+)\.(\d\d).*$/, '$1$2.$3'); //只能输入两个小数
      numberT.value = val;
    }
    emits('update:value', numberT.value);
  });

  onMounted(() => {
    nextTick(() => {
      inputRef.value.focus(); // 展示编辑框即获取焦点
    });
  });
</script>

<style lang="scss" scoped>
  .el-input {
    position: relative;
    .self-input-number {
      font-family: Inter;
      font-size: 15px;
      text-align: right;
      padding-right: 10px;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none !important;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }
  }
</style>
