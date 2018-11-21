
// https://gist.github.com/gokulkrishh/242e68d1ee94ad05f488

export const mobileMaxWidth = 767;
export const mobilePortraitMaxWidth = 480;
export const tabletMaxWidth = 1024;
export const desktopMinWidth = tabletMaxWidth + 1;

export const tabletPortrait = `@media (min-width: ${mobileMaxWidth +
  1}px) and (max-width: ${tabletMaxWidth}px)`;
export const mobile = `@media (max-width: ${mobileMaxWidth}px)`;
export const mobileLandscape = `@media (min-width: ${mobilePortraitMaxWidth +
  1}px) and (max-width: ${mobileMaxWidth}px)`;
export const mobilePortrait = `@media (max-width: ${mobilePortraitMaxWidth}px)`;
export const notMobile = `@media (min-width: ${mobileMaxWidth + 1}px)`;
export const desktop = `@media (min-width: ${desktopMinWidth}px)`;
