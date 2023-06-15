export default defineEventHandler(async (event) => {

  const result = await useStorage().getItem('redis:appList') || {}
  console.log(typeof result)
  return {
    code: 200,
    data: result,
    message: ''
  }
})
