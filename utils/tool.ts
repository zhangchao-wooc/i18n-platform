
const queryType = (data: any) => Object.prototype.toString.call(data)

export const isObject = (d: any) => queryType(d) === '[object Object]'
export const isArray = (d: any) => Array.isArray(d)
export const isString = (d: any) => typeof d === 'string'
export const isNumber = (d: any) => typeof d === 'number'
