
import { css, StyleSheet } from 'aphrodite/no-important';

type SheetDefinition = { [key: string]: {} };

type KeyType = string | false;

export default function makeStyles(inputStyles: SheetDefinition) {
  const styles = StyleSheet.create(inputStyles);

  return (...keys: KeyType[]) => {
    return css(...keys.map(key => !!key && styles[key]));
  };
}
