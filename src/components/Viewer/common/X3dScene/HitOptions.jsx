// @flow strict
import _ from 'lodash';
import { PureComponent } from 'react';

import type { Point } from 'types';
import { type OpName } from 'polyhedra/operations';
import connect from 'components/connect';
import { WithPolyhedron, WithOperation, ApplyOperation } from '../../context';

// TODO define this property in the operation
function getHitOption(opName: OpName) {
  switch (opName) {
    case 'augment':
      return 'face';
    case 'diminish':
    case 'gyrate':
      return 'cap';
    case 'cumulate':
    case 'contract':
      return 'faceType';
    default:
      return '';
  }
}

class HitOptions extends PureComponent<*> {
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

  applyWithHitOption = (hitPnt: Point) => {
    const {
      operation,
      polyhedron,
      opName,
      options,
      applyOperation,
      setOption,
      isTransitioning,
    } = this.props;
    if (!operation || isTransitioning) return;
    const hitOption = getHitOption(opName);
    const newHitOptions = operation.getHitOption(polyhedron, hitPnt, options);
    const newValue = newHitOptions[hitOption];
    // only apply operation if we have a hit
    if (options && newValue) {
      applyOperation(opName, { ...options, [hitOption]: newValue }, result => {
        if (hitOption === 'cap' && options[hitOption]) {
          setOption('cap', options[hitOption].withPolyhedron(result));
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
