import React from 'react'
import { StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

import Title from './Title'
import { fixed } from '../styles/common'

const ViewerTitle = ({ text }) => {
  const styles = StyleSheet.create({
    title: {
      ...fixed('bottom', 'right'),
      maxWidth: '50%',
      textAlign: 'right',
    }
  })

  return <Title styles={styles.title}>{ _.capitalize(text) }</Title>
}

export default ViewerTitle
