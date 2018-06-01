// @flow strict
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

/* Position functions */

export const fullScreen = {
  position: 'absolute',
  height: '100%',
  width: '100%',
};

export const fixed = (vert: 'top' | 'bottom', horiz: 'left' | 'right') => ({
  position: 'fixed',
  [vert]: 0,
  [horiz]: 0,
});

/* Reset styles */

export const resetButton = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

export const resetLink = {
  textDecoration: 'none',
};
