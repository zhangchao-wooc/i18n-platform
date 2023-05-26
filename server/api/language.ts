/**
 * quert current app language list
 *
 */
export default defineEventHandler((event) => {
  return {
    languageList: [
      {
        label: '简体中文',
        value: 'zh'
      },
      {
        label: 'English',
        value: 'en'
      }
    ]
  }
})
