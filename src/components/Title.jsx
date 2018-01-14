import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { andaleMono } from '../styles/fonts'

const Title = ({ name, ...props }) => {
  const styles = StyleSheet.create({
    title: {
      fontFamily: andaleMono,
      fontSize: 36,
      fontWeight: 'bold',
    },
  })

  return <h1 className={css(styles.title, props.styles)}>{name}</h1>
}

export default Title
