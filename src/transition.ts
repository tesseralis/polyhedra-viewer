import _ from 'lodash';
import * as d3 from 'd3-ease';
import { interpolate } from 'd3-interpolate';

export interface TransitionOptions<T> {
  startValue: T;
  endValue: T;
  duration: number;
  ease?: 'easePolyInOut' | 'easePolyOut' | 'easePolyIn';
  onFinish(): void;
}

/**
 * An animation function based on d3's interpolate.
 * @returns an cancel() function
 */
export default function transition<T extends object>(
  options: TransitionOptions<T>,
  updateCallback: (T) => void,
) {
  const {
    startValue,
    endValue,
    // Duration, in milliseconds
    duration,
    ease = 'easePolyInOut',
    onFinish = _.noop,
  } = options;
  let start = 0;
  const id: { current?: any } = {};
  // Adapted from:
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  const interp = interpolate(startValue, endValue);
  const step = timestamp => {
    if (!start) {
      start = timestamp;
    }
    const delta = timestamp - start;
    const progress = Math.min(delta / duration, 1);
    const currentValue = interp(d3[ease](progress));
    updateCallback(currentValue);
    if (delta < duration) {
      id.current = requestAnimationFrame(step);
    } else {
      onFinish();
    }
  };
  id.current = requestAnimationFrame(step);
  return {
    cancel() {
      cancelAnimationFrame(id.current);
    },
  };
}
