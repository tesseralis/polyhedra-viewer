import { StyleSheet } from 'aphrodite/no-important';
import { andaleMono } from './styles/fonts';

const styles = StyleSheet.create({
  sidebar: {
    width: 400,
    overflow: 'scroll',
    backgroundColor: 'WhiteSmoke', // TODO colors file
  },

  group: {
    padding: '10px 0',
  },

  groupHeader: {
    margin: '5px 12px',
  },

  link: {
    display: 'block',
    padding: '3px 12px',

    color: 'DimGrey',
    textDecoration: 'none',
    lineHeight: '18px',
    fontFamily: andaleMono,
    fontSize: 14,
  },

  isActive: {
    color: 'DarkSlateGray',
    fontWeight: 'bolder',
  },
});

export default styles;
