// @flow strict
import React from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';

type SheetDefinition = { [string]: mixed };
type Props = { [string]: mixed };

const styled = (element: React$ElementType) => (def: SheetDefinition) => {
  const elementName = typeof element === 'string' ? element : element.name;
  const styles = StyleSheet.create({
    [elementName]: def,
  });
  const El = element;
  return (props: Props) => (
    <El className={css(styles[elementName])} {...props} />
  );
};

const domElements = [
  'div',
  'span',
  'main',
  'footer',
  'section',
  'h1',
  'h2',
  'h3',
  'p',
  'ul',
  'ol',
  'li',
  'table',
  'caption',
  'th',
  'td',
  'a',
  'button',
  'img',
  'em',
  'strong',
  'form',
  'label',
];

const withProps = propsToAdd => (component: React$ElementType) => {
  const Component = component;
  return props => <Component {...propsToAdd} {...props} />;
};

domElements.forEach(el => {
  const styledEl = styled(el);
  styled[el] = styledEl;
  styled[el].attrs = props => def => withProps(props)(styledEl(def));
});

export default styled;
