import config from '../config'
import { buildKaraokeEmbedCode } from '@story-telling-reporter/react-embed-code-generator'
import { list, graphql } from '@keystone-6/core'
import { checkbox, text, file, virtual, select } from '@keystone-6/core/fields'

const listConfigurations = list({
  fields: {
    name: text({
      label: 'Karaoke 名稱',
      validation: { isRequired: true },
    }),
    webVtt: text({
      label: '字幕（WebVTT 格式）',
      ui: {
        displayMode: 'textarea',
      },
      defaultValue: `WEBVTT
00:00:00.000 --> 00:00:04.500
演員，我覺得他就是一個生活的體驗者,

00:00:04.600 --> 00:00:07.500
然後生命的實踐家;

00:00:08.000 --> 00:00:11.000
期許自己啦，可以這麼做。
`,
    }),
    quote: text({
      label: '引言',
      ui: {
        itemView: {
          fieldMode: 'hidden',
        },
        createView: {
          fieldMode: 'hidden',
        },
        listView: {
          fieldMode: 'hidden',
        },
      },
    }),
    quoteBy: text({
      label: '聲音來源',
    }),
    audio: file({
      storage: 'files',
    }),
    muteHint: checkbox({
      label: '是否產生「聲音播放提示」的 embed code',
      defaultValue: false,
    }),
    theme: select({
      label: '哪裡要使用 embed code？',
      options: [
        {
          label: '報導者文章頁',
          value: 'twreporter',
        },
        {
          label: '少年報導者文章頁',
          value: 'kids',
        },
      ],
      defaultValue: 'twreporter',
    }),
    embedCode: virtual({
      label: 'Karaoke embed code',
      field: graphql.field({
        type: graphql.String,
        resolve: async (item: Record<string, unknown>): Promise<string> => {
          const audioSrc = `${config.gcs.urlPrefix}/files/${item?.audio_filename}`

          const code = buildKaraokeEmbedCode({
            componentTheme: item?.theme,
            audioUrls: [audioSrc],
            webVtt: item?.webVtt,
            quoteBy: item?.quoteBy,
          })

          return `<!-- 聲音金句卡拉OK版：${item.name} -->` + code
        },
      }),
      ui: {
        views: './lists/views/embed-code',
        createView: {
          fieldMode: 'hidden',
        },
      },
    }),
    hintEmbedCode: virtual({
      label: '聲音提示 embed code',
      field: graphql.field({
        type: graphql.String,
        resolve: async (item: Record<string, unknown>): Promise<string> => {
          const muteHint = item?.muteHint
          if (muteHint) {
            return (
              `<!--  開頭聲音提示 -->` +
              buildKaraokeEmbedCode({
                hintOnly: true,
              })
            )
          }

          return ''
        },
      }),
      ui: {
        views: './lists/views/embed-code',
        createView: {
          fieldMode: 'hidden',
        },
      },
    }),
  },
  ui: {
    listView: {
      initialSort: { field: 'id', direction: 'DESC' },
      initialColumns: ['name', 'quote'],
      pageSize: 50,
    },
    labelField: 'name',
  },

  access: () => true,
  hooks: {},
})

export default listConfigurations
