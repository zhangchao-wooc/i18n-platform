/**
 * quert current app language list
 *
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  setResponseHeader(event, 'Content-type', 'application/force-download')
  setResponseHeader(event, 'Content-Disposition', 'attachment;filename=' + encodeURI('add'))

  return JSON.stringify(body)
})
