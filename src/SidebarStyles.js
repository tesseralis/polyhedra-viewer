import { StyleSheet } from 'aphrodite/no-important';
import { andaleMono } from './styles/fonts';

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 100, // TODO have a list of these

    display: 'flex',
    flexDirection: 'row',
  },

  content: {
    width: 400,
    overflow: 'scroll',
    backgroundColor: 'WhiteSmoke', // TODO colors file
  },

  homeLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    padding: 10,
    marginBottom: 8, // TODO don't be so lazy

    borderBottom: 'DarkSlateGray 1px solid',

    fontFamily: andaleMono,
    fontSize: 20,
    color: 'DarkSlateGray',
    textDecoration: 'none',
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

  toggle: {
    margin: 0,
    padding: 2,
    fontSize: 16,
  },
});

export default styles;
