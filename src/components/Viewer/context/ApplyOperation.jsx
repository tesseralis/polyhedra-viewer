// @flow strict
import _ from 'lodash';
import { Component } from 'react';

import { type OpName } from 'math/operations';
import { operations } from 'math/operations';
import connect from 'components/connect';
import { WithPolyhedron } from './PolyhedronContext';
import { WithOperation } from './OperationContext';

class ApplyOperation extends Component<*> {
  render() {
    return this.props.children({
      applyOperation: this.applyOperation,
      selectOperation: this.selectOperation,
    });
  }

  applyOperation = (
    opName = this.props.opName,
    options = this.props.options,
    callback?: *,
  ) => {
    const {
      polyhedron,
      setName,
      transitionPolyhedron,
      setOperation,
      unsetOperation,
    } = this.props;
    const operation = operations[opName];

    if (!operation) throw new Error('no operation defined');

    const { result, animationData } = operation.apply(polyhedron, options);
    if (!operation.hasOptions(polyhedron) || _.isEmpty(options)) {
      unsetOperation();
    } else {
      setOperation(opName, result);
    }

    transitionPolyhedron(result, animationData);
    setName(result.name);
    if (typeof callback === 'function') {
      callback(result);
    }
  };

  selectOperation = (opName: OpName) => {
    const { polyhedron, unsetOperation, setOperation } = this.props;
    const operation = operations[opName];
    if (opName === this.props.opName) {
      return unsetOperation();
    }

    if (!operation.hasOptions(polyhedron)) {
      this.applyOperation(opName);
    } else {
      setOperation(opName, polyhedron);
    }
  };
}

export default _.flow([
  connect(
    WithOperation,
    ['opName', 'options', 'setOperation', 'unsetOperation'],
  ),
  connect(
    WithPolyhedron,
    ['setName', 'polyhedron', 'transitionPolyhedron'],
  ),
])(ApplyOperation);
