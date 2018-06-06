// @flow strict
import _ from 'lodash';
import { Component } from 'react';

import type { Point } from 'types';
import { type OpName } from 'polyhedra/operations';
import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';
import { WithOperation } from 'components/Viewer/OperationContext';
import ApplyOperation from 'components/Viewer/ApplyOperation';

// TODO define this property in the operation
function getHitOption(opName: OpName) {
  switch (opName) {
    case 'augment':
      return 'face';
    case 'diminish':
    case 'gyrate':
      return 'peak';
    case 'cumulate':
    case 'contract':
      return 'faceType';
    default:
      return '';
  }
}

class HitOptions extends Component<*> {
  render() {
    return this.props.children({
      setHitOption: this.setHitOption,
      unsetHitOption: this.unsetHitOption,
      applyWithHitOption: this.applyWithHitOption,
    });
  }

  setHitOption = (hitPnt: Point) => {
    const {
      operation,
      opName,
      options,
      setOption,
      polyhedron,
      isTransitioning,
    } = this.props;
    if (!operation || isTransitioning) return;
    const hitOption = getHitOption(opName);
    const newHitOptions = operation.getHitOption(polyhedron, hitPnt, options);
    if (_.isEmpty(newHitOptions)) {
      return setOption(hitOption, undefined);
    }
    const newValue = newHitOptions[hitOption];
    if (!_.isEqual(options[hitOption], newValue)) {
      setOption(hitOption, newValue);
    }
  };

  unsetHitOption = () => {
    const { opName, options, setOption } = this.props;
    const hitOption = getHitOption(opName);
    if (_.get(options, hitOption) !== undefined) {
      setOption(hitOption, undefined);
    }
  };

  applyWithHitOption = () => {
    const { opName, options, applyOperation, setOption } = this.props;
    const hitOption = getHitOption(opName);
    // only apply operation if we have a hit
    if (options[hitOption] !== undefined) {
      applyOperation(opName, options, result => {
        if (hitOption === 'peak') {
          setOption('peak', options[hitOption].withPolyhedron(result));
        }
      });
    }
  };
}

export default _.flow([
  connect(
    WithOperation,
    ['opName', 'operation', 'options', 'setOption'],
  ),
  connect(
    WithPolyhedron,
    ['polyhedron', 'isTransitioning'],
  ),
  connect(
    ApplyOperation,
    ['applyOperation'],
  ),
])(HitOptions);
