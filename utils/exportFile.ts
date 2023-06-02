// import { convertToXml } from './parser'
import * as XLSX from 'xlsx';

// interface ExportFileUtilsType {
//   data: Record<string, any>
//   name: string
//   type?: 'json' | 'xml' | 'xlsx',
//   scene?: 'DIFF',
//   diffType?: 'add' | 'remove' | 'change' | 'empty' | 'all'
// }

// export const exportFile = async ({ data, name, type = 'json', scene, diffType }: ExportFileUtilsType) => {
//   let fielDataStructure: string = ''
//   const newData: Record<string, string> = {}

//   if ( scene === 'DIFF') {
//     if (!diffType) throw 'exportFile: params "diffType" cannot be empty when scene is "DIFF"'
//     if (diffType !== 'all') {
//       // query diff structure
//       if (Array.isArray(data[diffType])) {
//         data[diffType].forEach((item: Record<string, string>) => {
//           Object.assign(newData, item)
//         });
//         fielDataStructure = JSON.stringify(newData, null, 4)
//       }
//     } else {
//       fielDataStructure = JSON.stringify(data, null, 4)
//     }
//   }

//   if (type === 'xml') {
//     // fielDataStructure = convertToXml(data)
//     const 
//   }

//   dowmload({
//     data: newData,
//     name,
//     type
//   })
// }

interface DowmloadUtilsType {
  data: string
  name: string
  type?: 'json' | 'xml' | 'xlsx'
}

const fileTypeMap: Record<string, string> = {
  'json': 'application/json',
  'xml': 'text/xml',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

export const exportFile = ({data, name, type = 'json'}: DowmloadUtilsType) => {
  console.log(fileTypeMap[type])
  var blob = new Blob([data], { type: fileTypeMap[type] });
  // create URL object
  var url = window.URL.createObjectURL(blob);
  // create a element
  var a = document.createElement("a");
  a.href = url;
  // download file name
  a.download = `${name}-${new Date().getTime()}.${type}`; 
  a.click();
  // remove create object before
  window.URL.revokeObjectURL(url);
}

export const exportXlxsFile = (rows: Record<string, any>[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'i18n');
  XLSX.writeFile(workbook, `${fileName}-${new Date().getTime()}.xlsx`, {compression: true});
}
