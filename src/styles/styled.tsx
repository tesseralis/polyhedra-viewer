import React, { ReactType, ComponentType } from 'react';
import { StyleSheet, css, CSSProperties } from 'aphrodite/no-important';

type SheetDefinition = CSSProperties;
type Props = { [key: string]: any };

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

interface StyleGenerator {
  (def: SheetDefinition): ComponentType<any>;
  attrs(props: Props): (def: SheetDefinition) => ComponentType<any>;
}

interface Styled {
  (element: ReactType): StyleGenerator;
  [node: string]: StyleGenerator;
}

const withProps = (propsToAdd: Props) => (component: ReactType) => {
  const Component = component;
  return (props: Props) => <Component {...propsToAdd} {...props} />;
};

const styled = ((element: ReactType) => {
  const gen = (def: SheetDefinition) => {
    const elementName = typeof element === 'string' ? element : element.name;
    const styles = StyleSheet.create({
      [elementName]: def,
    });
    const El = element;
    return (props: Props) => (
      <El className={css(styles[elementName])} {...props} />
    );
  };
  gen.attrs = (props: Props) => (def: SheetDefinition) =>
    withProps(props)(gen(def));
  return gen;
}) as Styled;

domElements.forEach(el => {
  styled[el] = styled(el);
});

export default styled;
