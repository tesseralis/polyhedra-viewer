import * as React from 'react';
export { default } from 'react';

const memo = fn => fn;
module.exports = { ...React, memo };
