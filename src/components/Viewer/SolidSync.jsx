// @flow strict
import { Component } from 'react';
import connect from 'components/connect';
import { WithPolyhedron } from './context';

class SolidSync extends Component<*> {
  constructor(props: *) {
    super(props);
    const { solid, setPolyhedron } = props;
    setPolyhedron(solid);
  }

  componentDidUpdate(prevProps) {
    const { solid, panel, setPolyhedron } = this.props;

    // If an operation has not been applied and there is a mismatch betweeen the props and context,
    // update context
    if (solid !== prevProps.solid && panel !== 'operations') {
      setPolyhedron(solid);
    }
  }

  render() {
    return null;
  }
}

export default connect(
  WithPolyhedron,
  ['setPolyhedron'],
)(SolidSync);
