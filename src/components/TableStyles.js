import { StyleSheet } from 'aphrodite/no-important'

import { hoeflerText, andaleMono } from '../styles/fonts'
import { fadeIn } from '../styles/animations'

const thumbnailSize = 100
const maxThumbnailsPerLine = 7

const styles = StyleSheet.create({
  table: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',

    animationName: fadeIn,
    animationDuration: '1s',
  },

  title: {
    padding: 32,
    fontFamily: andaleMono,
    fontSize: 36,
    fontWeight: 'bold',
  },
  
  group: {
    margin: 18,
    maxWidth: 1000,
  },
  
  groupHeader: {
    margin: '5px 0', // TODO figure out another notation for this?
  },
  
  groupDescription: {
    fontFamily: hoeflerText,
    color: 'DimGrey',
    margin: 14,
    lineHeight: '22px',
  },
  
  list: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: maxThumbnailsPerLine * thumbnailSize,
    margin: 'auto',
  },
  
  link: {
    width: thumbnailSize,
    height: thumbnailSize,
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  image: {
    height: thumbnailSize,
  },
})

export default styles
