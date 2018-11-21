import _ from 'lodash';

import React, { memo } from 'react';

import { makeStyles } from 'styles';
import {
  Point2D,
  Polygon,
  PolyLine,
  PolyShape,
  polygonPoints,
} from 'components/svg';

const color = 'DimGray';
const styles = makeStyles({
  icon: {
    width: 40,
    height: 40,
  },

  outer: {
    stroke: color,
    fill: 'none',
    strokeWidth: 8,
    strokeLinejoin: 'round',
  },

  inner: {
    stroke: color,
    fill: 'none',
    strokeWidth: 5,
    strokeLinejoin: 'round',
  },
});

interface Props {
  name: string;
}

function drawIcon(name: string) {
  switch (name) {
    case 'ortho':
      return (
        <>
          <Polygon
            className={styles('outer')}
            n={5}
            cx={100}
            cy={100}
            a={90}
            r={100}
          />
          <Polygon
            className={styles('inner')}
            n={5}
            cx={100}
            cy={100}
            a={90}
            r={66}
          />
        </>
      );
    case 'gyro':
      return (
        <>
          <Polygon
            className={styles('outer')}
            n={5}
            cx={100}
            cy={100}
            a={90}
            r={100}
          />
          <Polygon
            className={styles('inner')}
            n={5}
            cx={100}
            cy={100}
            a={-90}
            r={66}
          />
        </>
      );
    case 'pyramid':
      return (
        <>
          <PolyShape
            className={styles('outer')}
            points={[[100, 50], [10, 170], [190, 170]]}
          />
          <PolyLine
            className={styles('inner')}
            points={[[140, 170], [100, 50], [60, 170]]}
          />
        </>
      );
    case 'fastigium': {
      const center = 100;
      const height = 50;
      const topY = center - height;
      const bottomY = center + height;
      return (
        <>
          <PolyShape
            className={styles('outer')}
            points={[[150, topY], [50, topY], [10, bottomY], [190, bottomY]]}
          />
          <PolyLine
            className={styles('inner')}
            points={[[150, topY], [120, bottomY]]}
          />
        </>
      );
    }
    case 'cupola': {
      const center = 100;
      const height = 50;
      const topY = center - height;
      const bottomY = center + height;
      const topWidth = 50;
      const bottomWidth = 90;
      const topLeftX = center - topWidth;
      const topRightX = center + topWidth;
      return (
        <>
          <PolyShape
            className={styles('outer')}
            points={[
              [topRightX, topY],
              [topLeftX, topY],
              [center - bottomWidth, bottomY],
              [center + bottomWidth, bottomY],
            ]}
          />
          <PolyLine
            className={styles('inner')}
            points={[
              [topLeftX, topY],
              [topLeftX, bottomY],
              [topRightX, bottomY],
              [topRightX, topY],
            ]}
          />
        </>
      );
    }
    case 'rotunda': {
      const points = _.take(
        polygonPoints({ n: 12, cx: 100, cy: 150, r: -90 }),
        7,
      );
      const [p1, p2, p3, p4, p5, p6] = points;
      const bottomY = p1[1];
      const q1: Point2D = [p3[0], p2[1]];
      const q2: Point2D = [p5[0], p6[1]];
      return (
        <>
          <PolyShape className={styles('outer')} points={points} />
          <PolyShape
            className={styles('inner')}
            points={[[70, bottomY], q1, p4, q2, [130, bottomY]]}
          />
          <PolyLine
            className={styles('inner')}
            points={[p3, q1, [40, bottomY], [160, bottomY], q2, p5]}
          />
        </>
      );
    }
    default:
      throw new Error('unknown icon type');
  }
}
export default memo(function OptionIcon({ name }: Props) {
  return (
    <svg viewBox="0 0 200 200" className={styles('icon')}>
      {drawIcon(name)}
    </svg>
  );
});
