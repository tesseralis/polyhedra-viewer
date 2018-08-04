// @flow strict
import { Component } from 'react';

interface Props {
  title: string;
}

export default class PageTitle extends Component<Props> {
  constructor(props: Props) {
    super(props);
    document.title = props.title;
  }

  componentDidUpdate(prevProps: Props) {
    const { title } = this.props;
    if (title !== prevProps.title) {
      document.title = title;
    }
  }

  render() {
    return null;
  }
}
