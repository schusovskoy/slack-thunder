import type {
  Component,
  Fragment,
  Provider,
  ReslackElement,
  ReslackNode,
} from './entities'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type DispatchActionConfig = {
      trigger_actions_on?: ('on_enter_pressed' | 'on_character_entered')[]
    }
    type ConversationsFilter = {
      include?: string[]
      exclude_external_shared_channels?: boolean
      exclude_bot_users?: boolean
    }

    type ElementType = string | Fragment | Provider<unknown> | Component<never>
    type Element = ReslackElement
    type ElementChildrenAttribute = { children: ReslackNode }

    type IntrinsicElements = {
      confirm: {
        /** plain_text */
        title: ReslackElement | string
        /** text: plain_text */
        children: ReslackNode
        /** plain_text */
        confirm: ReslackElement | string
        /** plain_text */
        deny: ReslackElement | string
        style?: 'primary' | 'danger'
      }
      option: {
        /** text: mrkdwn (radio, checkboxes), plain_text */
        children: ReslackNode
        value: string
        /** plain_text */
        description?: ReslackElement | string
        url?: string
      }
      option_group: {
        /** plain_text */
        label: ReslackElement | string
        /** options: option */
        children: ReslackNode
      }
      /**
       * Blocks: Section, Actions
       * Surfaces: Home, Modal, Message
       * */
      button: {
        /** text: plain_text */
        children: ReslackNode
        value?: string
        style?: 'primary' | 'danger'
        /** confirm */
        confirm?: ReslackElement
        accessibility_label?: string
        action_id: string | Component<never>
        url?: string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       * */
      checkboxes: {
        action_id: string | Component<never>
        /** options: option */
        children: ReslackNode
        /** option */
        initial_options?: ReslackNode
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       * */
      datepicker: {
        action_id: string | Component<never>
        initial_date?: string
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Actions, Input
       * Surfaces: Modal
       * */
      datetimepicker: {
        action_id: string | Component<never>
        initial_date_time?: number
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
      }
      /**
       * Blocks: Input
       * Surfaces: Modal
       */
      email_text_input: {
        action_id: string | Component<never>
        initial_value?: string
        dispatch_action_config?: DispatchActionConfig
        focuse_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Can itself be a block
       * Blocks: Section, Context
       * Surfaces: Home, Modal, Message
       */
      image: {
        image_url: string
        alt_text: string
        /** plain_text (only when using as a block) */
        title?: ReslackElement | string
        /** only when using as a block */
        block_id?: string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      multi_static_select: {
        action_id: string | Component<never>
        /** option */
        options?: ReslackNode
        /** option_group */
        option_groups?: ReslackNode
        /** option */
        initial_options?: ReslackNode
        /** confirm */
        confirm?: ReslackElement
        max_selected_items?: number
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      multi_external_select: {
        action_id: string | Component<never>
        min_query_length?: number
        /** option */
        initial_options?: ReslackNode
        /** confirm */
        confirm?: ReslackElement
        max_selected_items?: number
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      multi_users_select: {
        action_id: string | Component<never>
        initial_users?: string[]
        /** confirm */
        confirm?: ReslackElement
        max_selected_items?: number
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      multi_conversations_select: {
        action_id: string | Component<never>
        initial_conversations?: string[]
        default_to_current_conversation?: boolean
        /** confirm */
        confirm?: ReslackElement
        max_selected_items?: number
        filter?: ConversationsFilter
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      multi_channels_select: {
        action_id: string | Component<never>
        initial_channels?: string[]
        /** confirm */
        confirm?: ReslackElement
        max_selected_items?: number
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Input
       * Surfaces: Modal
       */
      number_input: {
        is_decimal_allowed: boolean
        action_id: string | Component<never>
        initial_value?: string
        min_value?: string
        max_value?: string
        dispatch_action_config?: DispatchActionConfig
        focuse_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions
       * Surfaces: Home, Modal, Message
       */
      overflow: {
        action_id: string | Component<never>
        /** options: option */
        children: ReslackNode
        /** confirm */
        confirm?: ReslackElement
      }
      /**
       * Blocks: Input
       * Surfaces: Home, Modal, Message
       */
      plain_text_input: {
        action_id: string | Component<never>
        initial_value?: string
        multiline?: boolean
        min_length?: number
        max_length?: number
        dispatch_action_config?: DispatchActionConfig
        focuse_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      radio_buttons: {
        action_id: string | Component<never>
        /** options: option */
        children: ReslackNode
        /** option */
        initial_option?: ReslackElement
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      static_select: {
        action_id: string | Component<never>
        /** option */
        options?: ReslackNode
        /** option_group */
        option_groups?: ReslackNode
        /** option */
        initial_option?: ReslackElement
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      external_select: {
        action_id: string | Component<never>
        /** option */
        initial_option?: ReslackElement
        min_query_length?: number
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      users_select: {
        action_id: string | Component<never>
        initial_user?: string
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      conversations_select: {
        action_id: string | Component<never>
        initial_conversation?: string
        default_to_current_conversation?: boolean
        /** confirm */
        confirm?: ReslackElement
        response_url_enabled?: boolean
        filter?: ConversationsFilter
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      channels_select: {
        action_id: string | Component<never>
        initial_channel?: string
        /** confirm */
        confirm?: ReslackElement
        response_url_enabled?: boolean
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions, Input
       * Surfaces: Home, Modal, Message
       */
      timepicker: {
        action_id: string | Component<never>
        initial_time?: string
        /** confirm */
        confirm?: ReslackElement
        focus_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
        timezone?: string
      }
      /**
       * Blocks: Input
       * Surfaces: Modal
       */
      url_text_input: {
        action_id: string | Component<never>
        initial_value?: string
        dispatch_action_config?: DispatchActionConfig
        focuse_on_load?: boolean
        /** plain_text */
        placeholder?: ReslackElement | string
      }
      /**
       * Blocks: Section, Actions
       * Surfaces: Message
       */
      workflow_button: {
        /** text: plain_text */
        children: ReslackNode
        workflow: {
          trigger: {
            url: string
            customizable_input_parameters?: { name: string; value: string }[]
          }
        }
        style?: 'primary' | 'danger'
        accessibility_label?: string
      }
      plain_text: {
        /** text: string */
        children: ReslackNode
        emoji?: boolean
        verbatim?: boolean
      }
      mrkdwn: {
        /** text: string */
        children: ReslackNode
        emoji?: boolean
        verbatim?: boolean
      }
      modal: {
        /** plain_text */
        title: ReslackElement | string
        /** plain_text */
        close?: ReslackElement | string
        /** plain_text */
        submit?: ReslackElement | string
        /** blocks */
        children: ReslackNode
        private_metadata?: string
        callback_id?: string | Component<never>
        clear_on_close?: boolean
        notify_on_close?: boolean
        external_id?: string
      }
      home: {
        /** blocks */
        children: ReslackNode
        private_metadata?: string
        callback_id?: string
        external_id?: string
      }
      header: {
        /** text: plain_text */
        children: ReslackNode
        block_id?: string
      }
      actions: {
        /** elements */
        children: ReslackNode
        block_id?: string
      }
      context: {
        /** elements: plain_text, mrkdwn, image */
        children: ReslackNode
        block_id?: string
      }
      divider: {
        block_id?: string
      }
      input: {
        /** plain_text */
        label: ReslackElement | string
        /** element */
        children: ReslackElement
        block_id?: string
        /** plain_text */
        hint?: ReslackElement | string
        optional?: boolean
        dispatch_action?: boolean
      }
      section: {
        /** text: plain_text, mrkdwn */
        children: ReslackNode
        block_id?: string
        /** plain_text, mrkdwn */
        fields?: ReslackNode
        accessory?: ReslackElement
      }
      video: {
        alt_text: string
        author_name?: string
        block_id?: string
        /** plain_text */
        description?: ReslackElement | string
        provider_icon_url?: string
        provider_name?: string
        /** title: plain_text */
        children: ReslackNode
        title_url?: string
        thumbnail_url: string
        video_url: string
      }
      raw: {
        value: { type: string }
      }
    }
  }
}
