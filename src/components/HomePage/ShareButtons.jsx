// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { Icon } from 'components/common';
import { fonts } from 'styles';

const styles = StyleSheet.create({
  share: {
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.andaleMono,
    marginRight: 5,
  },
  link: {
    margin: '0 5px',
    color: 'DimGrey',
  },
});

const url = 'http://polyhedra.tessera.li';

// FIXME more information in descriptions
const links = [
  {
    url: `https://www.facebook.com/sharer.php?u=${url}`,
    icon: 'facebook-box',
  },
  {
    url: `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${url}&title=Polyhedra Viewer&caption=Polyhedra Viewer`,
    icon: 'tumblr',
  },
  {
    url: `https://twitter.com/intent/tweet?url=${url}&text=Polyhedra Viewer&via=tesseralis`,
    icon: 'twitter',
  },
  {
    url: `https://reddit.com/submit?url=${url}&title=Polyhedra Viewer`,
    icon: 'reddit',
  },
];

export default function ShareButtons() {
  return (
    <div className={css(styles.share)}>
      <span className={css(styles.text)}>Share:</span>
      {links.map(({ url, icon }) => {
        return (
          <a
            className={css(styles.link)}
            href={url}
            key={icon}
            target="_blank"
            onClick={() =>
              // https://stackoverflow.com/questions/34507160/how-can-i-handle-an-event-to-open-a-window-in-react-js
              window.open(
                url,
                'share',
                'toolbar=0,status=0,width=548,height=325',
              )
            }
          >
            <Icon size={36} name={icon} />
          </a>
        );
      })}
    </div>
  );
}
