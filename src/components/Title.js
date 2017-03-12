import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'
import { andaleMono } from '../styles/fonts'

const Title = ({ name, ...props }) => {
  const styles = StyleSheet.create({
    title: {
      padding: 32,
      fontFamily: andaleMono,
      fontSize: 36,
      fontWeight: 'bold',
    },
  })

  return <h1 className={css(styles.title, props.styles)}>{ _.capitalize(name) }</h1>
}

export default Title
