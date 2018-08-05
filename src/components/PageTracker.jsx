// @flow strict
import { Component } from 'react';
import { withRouter, type Location } from 'react-router-dom';
import ReactGA from 'react-ga';

interface Props {
  location: Location;
}

class PageTracker extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.sendPageView(props.location);
  }

  render() {
    return null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.sendPageView(this.props.location);
    }
  }

  sendPageView(location: Location) {
    const { pathname, search } = location;
    ReactGA.pageview(pathname + search);
  }
}

export default withRouter(PageTracker);
