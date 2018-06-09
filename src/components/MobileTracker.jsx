// @flow strict
import _ from 'lodash';

function isMobile() {
  const width = window.innerWidth > 0 ? window.innerWidth : window.screen.width;
  return width <= 480;
}

interface Props {
  renderMobile?: () => React$Node;
  renderDesktop?: () => React$Node;
}

// FIXME do better resize handling
export default function MobileTracker({
  renderMobile = _.constant(null),
  renderDesktop = _.constant(null),
}: Props) {
  return isMobile() ? renderMobile() : renderDesktop();
}
