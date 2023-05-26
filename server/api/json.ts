import Ajv from 'ajv'

export default defineEventHandler((event) => {
  console.log(event.node.req.file)
  return {
    validate: true
  }
})
