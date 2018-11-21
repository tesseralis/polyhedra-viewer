import _ from 'lodash';

import React, { memo, ComponentType } from 'react';
import { makeStyles } from 'styles';

import { OpName } from 'math/operations';
import { Polygon, PolyLine } from 'components/svg';
const { sqrt } = Math;

const color = 'DimGray';
const styles = makeStyles({
  operationIcon: {
    width: 60,
    height: 60,
  },

  invariant: {
    fill: color,
    stroke: color,
    strokeWidth: 5,
    strokeLinejoin: 'round',
  },

  subtracted: {
    fill: 'none',
    stroke: color,
    strokeWidth: 5,
    strokeDasharray: 10,
  },

  added: {
    fill: 'none',
    stroke: color,
    strokeWidth: 5,
    strokeLinejoin: 'round',
  },

  changed: {
    fill: 'none',
    stroke: color,
    strokeWidth: 5,
  },
});

interface TruncateIconProps {
  styled: string;
  innerSides?: number;
  innerScale?: number;
  innerAngle?: number;
}

function TruncateIcon({
  styled,
  innerSides = 6,
  innerScale = 1 / sqrt(3),
  innerAngle = 0,
}: TruncateIconProps) {
  const center = { cx: 100, cy: 120 };
  const r = 100;
  return (
    <>
      <Polygon className={styles(styled)} n={3} r={r} a={-90} {...center} />
      <Polygon
        className={styles('invariant')}
        n={innerSides}
        r={r * innerScale}
        a={innerAngle}
        {...center}
      />
    </>
  );
}

function DualIcon() {
  const center = { cx: 100, cy: 100 };
  const r = 75;
  return (
    <>
      <Polygon
        className={styles('subtracted')}
        n={3}
        r={r}
        a={-90}
        {...center}
      />
      <Polygon className={styles('added')} n={3} r={r} a={90} {...center} />
      <Polygon
        className={styles('invariant')}
        n={6}
        r={r / sqrt(3)}
        a={0}
        {...center}
      />
    </>
  );
}

interface ExpandIconRenderProps {
  cx: number;
  cy: number;
  r: number;
  ap: number;
  r1: number;
  ap1: number;
}

interface ExpandIconProps {
  styled: string;
  render?: ComponentType<ExpandIconRenderProps>;
  hollow?: boolean;
  innerStyle?: string;
  innerAngle?: number;
}

function BaseExpandIcon({
  styled,
  render: Renderer = () => null,
  hollow = false,
  innerAngle = 0,
}: ExpandIconProps) {
  const [cx, cy] = [100, 100];
  const r = 80;
  const ap = (sqrt(3) * r) / 2;
  const r1 = r / sqrt(3);
  const ap1 = r1 / 2;
  return (
    <>
      <Polygon className={styles(styled)} n={6} r={r} a={0} cx={cx} cy={cy} />
      <Polygon
        className={styles(hollow ? styled : 'invariant')}
        n={3}
        r={r1}
        a={innerAngle}
        cx={cx}
        cy={cy}
      />
      <Renderer {...{ cx, cy, r, ap, r1, ap1 }} />
    </>
  );
}

function ExpandIcon({
  styled,
  render: Renderer = () => null,
  innerStyle = styled,
  hollow = false,
}: ExpandIconProps) {
  return (
    <BaseExpandIcon
      styled={styled}
      innerAngle={-90}
      hollow={hollow}
      render={({ cx, cy, r, ap, r1, ap1 }) => (
        <>
          {_.range(3).map(i => (
            <PolyLine
              key={i}
              className={styles(innerStyle)}
              transform={`rotate(${i * 120} ${cx} ${cy})`}
              points={[
                [cx - r / 2, cy - ap],
                [cx, cy - r1],
                [cx + r / 2, cy - ap],
              ]}
            />
          ))}
          <Renderer {...{ cx, cy, r, ap, r1, ap1 }} />
        </>
      )}
    />
  );
}

interface ElongateIconRenderProps {
  cx: number;
  cy: number;
  r: number;
  ap: number;
}
interface ElongateIconProps {
  styled: string;
  render?: ComponentType<ElongateIconRenderProps>;
}
function ElongateIcon({ styled, render: Renderer }: ElongateIconProps) {
  // TODO consolidate with expand
  const [cx, cy] = [100, 100];
  const r = 80;
  const ap = (sqrt(3) * r) / 2;
  return (
    <>
      <Polygon className={styles(styled)} n={6} r={r} a={90} cx={cx} cy={cy} />
      <PolyLine
        className={styles('invariant')}
        points={[[cx - ap, cy - r / 2], [cx, cy - r], [cx + ap, cy - r / 2]]}
      />
      <PolyLine
        className={styles('invariant')}
        points={[[cx - ap, cy + r / 2], [cx, cy + r], [cx + ap, cy + r / 2]]}
      />
      {Renderer ? (
        <Renderer {...{ cx, cy, r, ap }} />
      ) : (
        <rect
          className={styles(styled)}
          x={cx - r / 2}
          y={cy - r / 2 - 5}
          width={r}
          height={r + 10}
        />
      )}
    </>
  );
}

function AugmentIcon({ styled }: { styled: string }) {
  const [cx, cy] = [100, 100];
  const r = 80;
  const ap = (sqrt(3) * r) / 2;
  return (
    <>
      <Polygon className={styles(styled)} n={6} r={r} a={90} cx={cx} cy={cy} />
      <PolyLine
        className={styles('invariant')}
        points={[
          [cx - ap, cy - r / 2],
          [cx - ap, cy + r / 2],
          [cx, cy + r],
          [cx + ap, cy + r / 2],
          [cx + ap, cy - r / 2],
        ]}
      />
    </>
  );
}

function drawIcon(name: OpName) {
  switch (name) {
    case 'truncate':
      return <TruncateIcon styled="subtracted" />;
    case 'rectify':
      return (
        <TruncateIcon
          styled="subtracted"
          innerSides={3}
          innerScale={1 / 2}
          innerAngle={90}
        />
      );
    case 'sharpen':
      return <TruncateIcon styled="added" />;
    case 'dual':
      return <DualIcon />;
    case 'expand': {
      return <ExpandIcon styled="added" />;
    }
    case 'snub': {
      return (
        <BaseExpandIcon
          styled="added"
          hollow={false}
          innerAngle={0}
          render={({ cx, cy, r, ap, ap1 }) => (
            <>
              {_.range(3).map(i => (
                <PolyLine
                  key={i}
                  className={styles('added')}
                  transform={`rotate(${i * 120} ${cx} ${cy})`}
                  points={[
                    [cx - ap1, cy - r / 2],
                    [cx - r, cy],
                    [cx - ap1, cy + r / 2],
                    [cx - r / 2, cy + ap],
                  ]}
                />
              ))}
            </>
          )}
        />
      );
    }
    case 'contract': {
      return <ExpandIcon styled="subtracted" />;
    }
    case 'twist': {
      return (
        <ExpandIcon
          styled="changed"
          innerStyle="invariant"
          render={({ cx, cy, r, ap, ap1 }) => (
            <>
              {_.range(3).map(i => (
                <PolyLine
                  key={i}
                  className={styles('changed')}
                  transform={`rotate(${i * 120} ${cx} ${cy})`}
                  points={[[cx - r / 2, cy + ap1], [cx + r / 2, cy + ap]]}
                />
              ))}
            </>
          )}
        />
      );
    }

    case 'elongate':
      return <ElongateIcon styled="added" />;

    case 'gyroelongate':
      return (
        <ElongateIcon
          styled="added"
          render={({ cx, cy, r, ap }) => (
            <PolyLine
              className={styles('added')}
              points={[
                [cx - ap, cy - r / 2],
                [cx - r / 2, cy + r / 2],
                [cx, cy - r / 2],
                [cx + r / 2, cy + r / 2],
                [cx + ap, cy - r / 2],
              ]}
            />
          )}
        />
      );

    case 'shorten':
      return <ElongateIcon styled="subtracted" />;

    case 'turn':
      return (
        <ElongateIcon
          styled="added"
          render={({ cx, cy, r, ap }) => (
            <PolyLine
              className={styles('added')}
              points={[
                [cx - ap, cy - r / 2],
                [cx - r / 2, cy + r / 2],
                [cx - r / 2, cy - r / 2],
                [cx + r / 2, cy + r / 2],
                [cx + r / 2, cy - r / 2],
                [cx + ap, cy + r / 2],
              ]}
            />
          )}
        />
      );
    case 'augment':
      return <AugmentIcon styled="added" />;
    case 'diminish':
      return <AugmentIcon styled="subtracted" />;
    case 'gyrate':
      // TODO simplify the ExpandIcon hierarchy
      return (
        <>
          <ExpandIcon styled="subtracted" hollow />
          <g transform="rotate(180 100 100)">
            <ExpandIcon styled="added" hollow />
          </g>
        </>
      );
    default:
      throw new Error(`Unknown operation: ${name}`);
  }
}

interface Props {
  name: OpName;
}

export default memo(function OperationIcon({ name }: Props) {
  return (
    <svg viewBox="0 0 200 200" className={styles('operationIcon')}>
      {drawIcon(name)}
    </svg>
  );
});
