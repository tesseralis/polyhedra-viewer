// @flow
import _ from 'lodash';
import { Component } from 'react';
import { operations, type OpName } from 'math/operations';
import { applyOperation, getRelations } from 'polyhedra/operations';
import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';
import { WithOperation } from 'components/Viewer/OperationContext';

const hasMode = [
  'snub',
  'contract',
  'shorten',
  'cumulate',
  'augment',
  'diminish',
  'gyrate',
];

// TODO possibly move this as part of the operation definition
function hasOptions(solid, operation) {
  const relations = getRelations(solid, operation);
  if (_.isEmpty(relations)) return false;
  switch (operation) {
    case 'turn':
      return relations.length > 1 || !!_.find(relations, 'chiral');
    case 'twist':
      return relations[0].value[0] === 's';
    case 'snub':
    case 'gyroelongate':
      return !!_.find(relations, 'chiral');
    case 'cumulate':
    case 'contract':
    case 'shorten':
      return relations.length > 1;
    default:
      return _.includes(hasMode, operation);
  }
}

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

  // TODO this should just go in the panel connect
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
