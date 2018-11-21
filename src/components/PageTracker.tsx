import { useEffect } from 'react';
import { Location } from 'history';
import { withRouter } from 'react-router-dom';
import ReactGA from 'react-ga';

interface Props {
  location: Location;
}

// TODO figure out how to make this just a regular hook
function PageTracker({ location }: Props) {
  const { pathname, search } = location;
  useEffect(
    () => {
      ReactGA.pageview(pathname + search);
    },
    [location.pathname],
  );
  return null;
}

export default withRouter(PageTracker);
