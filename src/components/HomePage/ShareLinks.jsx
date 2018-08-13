// @flow strict
import React from 'react';
import { makeStyles } from 'styles';

import { Icon, SrOnly } from 'components/common';
import { fonts } from 'styles';

const styles = makeStyles({
  share: {
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.andaleMono,
    fontWeight: 'bold',
    marginRight: 5,
  },
  link: {
    margin: '0 10px',
    color: 'DimGrey',
  },
});

const url = 'http://polyhedra.tessera.li';
const title = 'Polyhedra Viewer';
const author = 'tesseralis';
const caption = 'Jinkies! Check out this cool polyhedral geometry app!';

const links = [
  {
    url: `https://www.facebook.com/sharer.php?u=${url}`,
    icon: 'facebook-box',
    name: 'Facebook',
  },
  {
    url: `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${url}&title=${title}&caption=${caption}`,
    icon: 'tumblr',
    name: 'Tumblr',
  },
  {
    url: `https://twitter.com/intent/tweet?url=${url}&text=${caption}&via=${author}`,
    icon: 'twitter',
    name: 'Twitter',
  },
  {
    url: `https://reddit.com/submit?url=${url}&title=${title}`,
    icon: 'reddit',
    name: 'Reddit',
  },
  {
    url: `https://plus.google.com/share?url=${url}&text=${title}`,
    icon: 'google-plus',
    name: 'Google Plus',
  },
];

export default function ShareLinks() {
  return (
    <div className={styles('share')}>
      <span className={styles('text')}>Share:</span>
      {links.map(({ url, icon, name }) => {
        return (
          <a
            className={styles('link')}
            href={url}
            key={icon}
            target="_blank"
            rel="noopener"
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
            <SrOnly>{`Share on ${name}`}</SrOnly>
          </a>
        );
      })}
    </div>
  );
}
