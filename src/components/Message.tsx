import {
  WebClient,
  type ChatPostMessageResponse,
  type ChatUpdateResponse,
} from '@slack/web-api'
import type { Component, ThunderNode } from '../entities'
import { useArgs, ArgsContext } from '../hooks'
import type { Block } from '@slack/bolt'
import { render } from '../render'

type MessageProps = {
  token?: string
  channel?: string
  messageTs?: string
  children?: ThunderNode
  responseType?: 'in_channel' | 'ephemeral' | 'replace' | 'delete'
  onSuccess?: (data: ChatUpdateResponse | ChatPostMessageResponse) => void
  onFail?: (error: Error) => void
}

export const Message: Component<MessageProps> = async ({
  token,
  channel,
  messageTs,
  children,
  responseType = 'replace',
  onSuccess,
  onFail,
}) => {
  const { client, args } = (() => {
    if (token) return { client: new WebClient(token), args: undefined }
    const args = useArgs()
    return { client: args.client, args }
  })()

  const message = await (async () => {
    if (!children || (!channel && responseType === 'delete')) return {}
    if (typeof children === 'string') return { text: children }
    if (Array.isArray(children) && children.some(a => typeof a === 'string')) {
      return { text: children.join('') }
    }
    const rendered = (await render(
      <ArgsContext.Provider value={args}>
        <>{children}</>
      </ArgsContext.Provider>,
    )) as unknown[]
    const blocks = rendered.filter(
      a => a !== null && !['undefined', 'boolean'].includes(typeof a),
    ) as Block[]
    return { blocks }
  })()

  if (!channel) {
    if (!args || !('respond' in args)) {
      throw new Error(
        'channel prop must be provided when rendring a Message outside of channel context.',
      )
    }
    const response = (() => {
      if (responseType === 'delete') return { delete_original: true }
      if (responseType === 'replace') return { replace_original: true }
      return { response_type: responseType, replace_original: false }
    })()
    await args
      .respond({ ...response, ...message })
      .then(onSuccess)
      .catch(onFail)
    return
  }

  if (messageTs) {
    await client.chat
      .update({ channel, ts: messageTs, ...message })
      .then(onSuccess)
      .catch(onFail)
    return
  }

  await client.chat
    .postMessage({ channel, ...message })
    .then(onSuccess)
    .catch(onFail)
}
