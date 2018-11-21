import { interpolate } from 'd3-interpolate';

export default ({ startValue, endValue, onFinish }: any, onUpdate: any) => {
  const interp = interpolate(startValue, endValue);
  onUpdate(interp(0));
  onUpdate(interp(0.5));
  onUpdate(interp(1));
  onFinish();
};
