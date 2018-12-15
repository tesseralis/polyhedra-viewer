import { CSSProperties } from 'aphrodite';

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

export const absoluteFull: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

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

/* Reset styles */

export const resetButton = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

export const resetLink = {
  textDecoration: 'none',
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
