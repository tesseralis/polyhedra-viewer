// @flow strict
import _ from 'lodash';
import { Component } from 'react';
import { operations, type OpName } from 'math/operations';
import { applyOperation, hasOptions } from 'polyhedra/operations';
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
      solidName,
      setName,
      transitionPolyhedron,
      setOperation,
      unsetOperation,
    } = this.props;
    const operation = operations[opName];

    if (!operation) throw new Error('no operation defined');

    const { result, name, animationData } = applyOperation(
      operation,
      solidName,
      polyhedron,
      options,
    );
    if (!name) throw new Error('Name not found on new polyhedron');
    if (!hasOptions(name, opName) || _.isEmpty(options)) {
      unsetOperation();
    } else {
      setOperation(opName, name);
    }

    setName(name);
    transitionPolyhedron(result, animationData);
    if (typeof callback === 'function') {
      callback(result);
    }
  };

  selectOperation = (opName: OpName) => {
    const { solidName, unsetOperation, setOperation } = this.props;
    if (opName === this.props.opName) {
      return unsetOperation();
    }

    if (!hasOptions(solidName, opName)) {
      this.applyOperation(opName);
    } else {
      setOperation(opName, solidName);
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
    ['solidName', 'setName', 'polyhedron', 'transitionPolyhedron'],
  ),
])(ApplyOperation);
