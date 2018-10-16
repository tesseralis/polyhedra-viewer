// @flow strict
import { interpolate } from 'd3-interpolate';

const transition = ({ startValue, endValue, onFinish }: *, onUpdate: *) => {
  const interp = interpolate(startValue, endValue);
  onUpdate(interp(0));
  onUpdate(interp(0.5));
  onUpdate(interp(1));
  onFinish();
};
module.exports = transition;
