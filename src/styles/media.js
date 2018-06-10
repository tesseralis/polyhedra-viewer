// @flow strict
// https://gist.github.com/gokulkrishh/242e68d1ee94ad05f488

export const mobileMaxWidth = 767;
export const desktopMinWidth = 1024;
export const mobile = `@media (max-width: ${mobileMaxWidth}px)`;
export const notMobile = `@media (min-width: ${mobileMaxWidth + 1}px)`;
export const desktop = `@media (min-width: ${desktopMinWidth}px)`;
