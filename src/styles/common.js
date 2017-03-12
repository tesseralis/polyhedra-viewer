export const hover = {
  ':hover': {
    backgroundColor: 'LightGray'
  }
}

// TODO figure out the place to put this
export const bigIcon = {
  padding: 10,
  color: 'Gray',
  ':hover': {
    color: 'DimGray'
  },
  ':focus': {
    outline: 'none',
    color: 'DarkSlateGray',
  },
}

/* Position functions */

export const fullScreen = {
  position: 'absolute',
  height: '100%',
  width: '100%',
}

export const fixed = (vert, horiz) => ({
  position: 'fixed',
  [vert]: 0,
  [horiz]: 0,
})

/* Reset styles */

export const resetButton = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
}

export const resetLink = {
  textDecoration: 'none',
}
