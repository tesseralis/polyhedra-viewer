import React from 'react'
import { StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'
import Title from './Title'

const ViewerTitle = ({ text }) => {
  const styles = StyleSheet.create({
    title: {
      position: 'fixed',
      bottom: 0,
      right: 0,
      maxWidth: '50%',
      textAlign: 'right',
    }
  })

  return <Title styles={styles.title}>{ _.capitalize(text) }</Title>
}

export default ViewerTitle
