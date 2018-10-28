// @flow strict
// $FlowFixMe
import React, { useEffect, useRef, useContext, Fragment } from 'react';
import _ from 'lodash';

import { TransitionContext } from '../../context';
import useSolidColors from './useSolidColors';
import useHitOptions from './useHitOptions';
import ConfigContext from 'components/ConfigContext';

// Join a list of lists with an inner and outer separator.
const joinListOfLists = (list: *, outerSep: string, innerSep: string) => {
  return _.map(list, elem => elem.join(innerSep)).join(outerSep);
};

const Coordinates = ({ points }) => {
  return <coordinate is="x3d" point={joinListOfLists(points, ', ', ' ')} />;
};

/* Edges */

const Edges = ({ edges, vertices }) => {
  return (
    <shape is="x3d">
      <indexedlineset is="x3d" coordindex={joinListOfLists(edges, ' -1 ', ' ')}>
        <Coordinates points={vertices} />
      </indexedlineset>
    </shape>
  );
};

export default function X3dPolyhedron() {
  const shape = useRef(null);
  const hitPnt = useRef(null);

  const colors = useSolidColors();
  const {
    setHitOption: onHover,
    unsetHitOption: onMouseOut,
    applyWithHitOption: onClick,
  } = useHitOptions();

  const listeners = {
    mousedown(e) {
      hitPnt.current = e.hitPnt;
    },
    mouseup(e) {
      if (!_.isEqual(hitPnt.current, e.hitPnt)) return;
      onClick(e.hitPnt);
    },
    mousemove(e) {
      hitPnt.current = e.hitPnt;
      onHover(e.hitPnt);
    },
    mouseout() {
      onMouseOut();
    },
  };

  useEffect(
    () => {
      if (shape.current !== null) {
        _.forEach(listeners, (fn, type) => {
          shape.current.addEventListener(type, fn);
        });
      }

      return () => {
        if (shape.current !== null) {
          _.forEach(listeners, (fn, type) => {
            shape.current.removeEventListener(type, fn);
          });
        }
      };
    },
    [onClick, onHover, onMouseOut],
  );

  const { transitionData } = useContext(TransitionContext);
  const { config } = useContext(ConfigContext);

  const { vertices, faces, edges } = transitionData;
  const { showFaces, showEdges, showInnerFaces, opacity } = config;

  const colorStr = joinListOfLists(colors, ',', ' ');
  return (
    <Fragment>
      {showFaces && (
        // NOTE: The mouse handlers are duplicated to make it easy to test on enzyme.
        // They don't actually do anything in production
        <shape
          is="x3d"
          ref={shape}
          onMouseDown={listeners.mousedown}
          onMouseMove={listeners.mousemove}
          onMouseUp={listeners.mouseup}
          onMouseOut={listeners.mouseout}
        >
          <appearance is="x3d">
            <material is="x3d" transparency={1 - opacity} />
          </appearance>
          <indexedfaceset
            is="x3d"
            solid={(!showInnerFaces).toString()}
            colorpervertex="false"
            coordindex={joinListOfLists(faces, ' -1 ', ' ')}
          >
            <Coordinates points={vertices} />
            <color is="x3d" color={colorStr} />
          </indexedfaceset>
        </shape>
      )}
      {showEdges && <Edges edges={edges} vertices={vertices} />}
    </Fragment>
  );
}
