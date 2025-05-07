import { wait } from '@/utils/utils';
import { ElMessage } from 'element-plus';
import ExcelJS from 'exceljs';

export const usePaste = (props, pasteCallback) => {
  // 将二维数组变成json数组
  const dataTransform = arr => {
    const targetObj = {};
    const { fieldObj } = props;
    return arr
      .map((item, index) => {
        const target = {};
        item.forEach((str, idx) => {
          if (index === 0) {
            if (fieldObj[str]) {
              targetObj[idx] = fieldObj[str];
            }
          } else {
            if (targetObj[idx]) {
              target[targetObj[idx]] = str;
            }
          }
        });
        return target;
      })
      .filter(item => Object.keys(item).length);
  };

  // // 将二进制字符串转换为ArrayBuffer对象
  // const s2ab = s => {
  //   const buf = new ArrayBuffer(s.length);
  //   const view = new Uint8Array(buf);
  //   for (let i = 0; i < s.length; i++) {
  //     view[i] = s.charCodeAt(i) & 0xff;
  //   }
  //   return buf;
  // };

  // const exportToExcel = (list, filename) => {
  //   const worksheet = XLSX.utils.aoa_to_sheet(list);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

  //   // // v本地下载文件
  //   // XLSX.writeFile(workbook, `${filename}.xlsx`);

  //   // 将工作簿转换为二进制对象
  //   const excelData = XLSX.write(workbook, {
  //     type: 'binary',
  //     bookType: 'xlsx'
  //   });

  //   // 创建Blob对象
  //   const blobData = new Blob([s2ab(excelData)], {
  //     type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //   });

  //   // 创建文件对象
  //   const excelFile = new File([blobData], `${filename}.xlsx`, {
  //     type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //   });
  //   return excelFile;
  // };

  const exportToExcel = async (list, filename) => {
    // 创建一个工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 添加数据到工作表
    list.forEach(row => {
      const rowData = worksheet.addRow(row);
      rowData.font = { size: 12 }; // 设置所有行的字体大小
    });

    // 将工作簿保存为 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();
    const blobData = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // 创建文件对象
    const excelFile = new File([blobData], `${filename}.xlsx`, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    return excelFile;
  };

  const onPaste = async e => {
    // 获取剪切板内容
    let text = '';
    // https环境才可以获取剪切板内容
    if (navigator?.clipboard?.readText) {
      const textarea = document.createElement('textarea');
      textarea.style.display = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      text = await navigator?.clipboard?.readText?.();
      document.body.removeChild(textarea);
    } else {
      ElMessage.warning('该浏览器暂不兼容，建议使用新版本Chrome浏览器！');
      // 本地调试
      await wait(0);
      text = e?.target?.value;
    }
    // 如果不存在制表符则报错return
    if (!text.includes('\t')) {
      ElMessage.warning('数据格式粘贴错误，请重新复制');
      return;
    }

    // 将字符串分割为二维数组
    let arr = text
      .replaceAll('\r', '')
      .split('\n')
      .map(item =>
        item
          .split('\t')
          // 如果只有数字和逗号则把逗号去除
          .map(item =>
            /^[\d,]+$/.test(item) ? item?.replaceAll?.(',', '') : item
          )
      )
      .filter(item => item.some(txt => !!txt));
    if (props.toExcel) {
      if (arr.length) {
        const file = await exportToExcel(arr, '表格');
        pasteCallback && pasteCallback(file, arr);
        return file;
      }
    } else {
      if (arr.length) {
        const result = [];
        arr = arr.filter(item => !!item).filter(item => item.length);
        // 去除表头不需要的数据(有些表格会有表头title，字段不会有表格的字段那么多)
        const sortArr = arr.sort((a, b) => b.length - a.length);
        const maxLength = sortArr[0].length;
        arr = arr.filter(item => item.filter(i => !!i).length >= maxLength - 2);
        const needSlice = text.includes(props.sliceTableKey);
        if (props.sliceTableKey && needSlice) {
          //需要将粘贴内容分割成两个表格的情况
          const index = arr[0].findIndex(item => item === props.sliceTableKey);
          let firstData = [];
          let secondData = [];

          arr.forEach(item => {
            firstData.push(item.slice(0, index));
            secondData.push([item[0], ...item.slice(index)]);
          });
          result.push(dataTransform(firstData));
          result.push(dataTransform(secondData));
        } else {
          result.push(dataTransform(arr));
        }

        pasteCallback && pasteCallback(result);
        return result;
      }
    }
  };

  // 获取剪切板里的内容
  const onPasteTxt = async () => {
    // 获取剪切板内容
    let text = '';
    // https环境才可以获取剪切板内容
    if (navigator?.clipboard?.readText) {
      const textarea = document.createElement('textarea');
      textarea.style.display = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      text = await navigator?.clipboard?.readText?.();
      document.body.removeChild(textarea);
    } else {
      ElMessage.warning('该浏览器暂不兼容，建议使用新版本Chrome浏览器！');
      return {
        state: false
      };
    }
    if (!text) {
      ElMessage.warning('粘贴内容不能为空！');
      return {
        state: false
      };
    }

    return {
      state: true,
      text
    };
  };

  // 转excel
  const txtToExcel = async text => {
    // 将字符串分割为二维数组
    let arr = text
      .replaceAll('\r', '')
      .split('\n')
      .map(item =>
        item
          .split('\t')
          // 如果只有数字和逗号则把逗号去除
          .map(item =>
            /^[\d,]+$/.test(item) ? item?.replaceAll?.(',', '') : item
          )
      )
      .filter(item => item.some(txt => !!txt));

    if (arr.length) {
      const file = await exportToExcel(arr, '表格');
      return file;
    }
    return false;
  };

  return {
    onPaste,
    onPasteTxt,
    txtToExcel
  };
};
