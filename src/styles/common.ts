import { CSSProperties } from 'aphrodite';

// TODO this is more of a "theme"
export const hover = {
  ':hover:not(:disabled)': {
    backgroundColor: 'Gainsboro',
  },
};

export const transition = (
  property: string,
  duration: number,
  ease: string = '',
) => {
  const value = `${property} ${duration}s ${ease}`.trim();
  return {
    transition: value,
  };
};

export function square(size: number): CSSProperties {
  return {
    width: size,
    height: size,
  };
}

/**
 * Populate the `color` and `fill` properties (useful for icons).
 * @param color the color to fill in
 */
export function colorFill(color: string): CSSProperties {
  return {
    color,
    fill: color,
  };
}

/* Layout functions */

export function flexRow(
  alignItems?: CSSProperties['alignItems'],
  justifyContent?: CSSProperties['justifyContent'],
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems,
    justifyContent,
  };
}

export function flexColumn(
  alignItems?: CSSProperties['alignItems'],
  justifyContent?: CSSProperties['justifyContent'],
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems,
    justifyContent,
  };
}

/* Position functions */

export const fullScreen = {
  position: 'absolute',
  height: '100%',
  width: '100%',
};

export function absolute(
  vert: 'top' | 'bottom',
  horiz: 'left' | 'right',
): CSSProperties {
  return {
    position: 'absolute',
    [vert]: 0,
    [horiz]: 0,
  };
}

export const absoluteFull: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/* Mobile */
export function scroll(direction?: 'x' | 'y') {
  const prop = `overflow${(direction || '').toUpperCase()}`;
  return {
    [prop]: 'scroll',
    // use momentum scrolling on mobile browsers
    '-webkit-overflow-scrolling': 'touch',
  };
}
