import type { View } from '@slack/bolt'
import type { Component, ReslackElement, ReslackNode } from '../entities'
import { ArgsContext, isBlockActionArgs, useArgs } from '../hooks'
import { render } from '../render'

type ModalProps = {
  children?: ReslackNode
  title: ReslackElement | string
  close?: ReslackElement | string
  submit?: ReslackElement | string
  callbackId?: Component<never> | string
  notifyOnClose?: boolean
  clearOnClose?: boolean
  externalId?: string
  privateMetadata?: object
}

export const Modal: Component<ModalProps> = async ({
  children = [],
  title,
  close,
  submit,
  callbackId,
  notifyOnClose,
  clearOnClose,
  externalId,
  privateMetadata,
}) => {
  const args = useArgs()
  if (!('trigger_id' in args.body)) {
    throw new Error('Modal must be rendered in response to a valid trigger_id.')
  }

  const triggerId = args.body.trigger_id as string
  const metadata = JSON.stringify({ ...privateMetadata, opened: true })
  const view = (await render(
    <ArgsContext.Provider value={args}>
      <modal
        title={title}
        close={close}
        submit={submit}
        callback_id={callbackId}
        notify_on_close={notifyOnClose}
        clear_on_close={clearOnClose}
        external_id={externalId}
        private_metadata={metadata}
      >
        {children}
      </modal>
    </ArgsContext.Provider>,
  )) as View

  const isAlreadyOpened = (() => {
    if (!isBlockActionArgs(args)) return false
    try {
      const metadata = args.body.view?.private_metadata || '{}'
      const opened = (JSON.parse(metadata) as { opened?: boolean }).opened
      return !!opened
    } catch {
      return false
    }
  })()

  if (!isBlockActionArgs(args) || !isAlreadyOpened) {
    await args.client.views.open({ trigger_id: triggerId, view })
    return
  }
  if (args.body.view?.type !== 'modal') {
    throw new Error('There is no modal to update.')
  }
  await args.client.views.update({ view_id: args.body.view.id, view })
}
