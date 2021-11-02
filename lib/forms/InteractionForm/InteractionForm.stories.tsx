import React from 'react'
import { ComponentMeta } from '@storybook/react'
 import { action } from '@storybook/addon-actions'
import { Container } from '@material-ui/core'
import {InteractionForm} from "./InteractionForm";

export default {
  title: 'Components/InteractionForm',
  component: InteractionForm,
  decorators: [
    Story => (
      <Container maxWidth='lg'>
        <Story />
      </Container>
    )
  ]
} as ComponentMeta<typeof InteractionForm>

export const emailInput = () => <InteractionForm onSubmit={action('onSubmit')} />

export const subscribing = () => <InteractionForm onSubmit={action('onSubmit')} isSubscribing />

export const withError = () => <InteractionForm onSubmit={action('onSubmit')} hasError />
