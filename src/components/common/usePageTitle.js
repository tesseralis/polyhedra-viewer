// @flow strict

// TODO is this the right folder to put this?
// $FlowFixMe
import { useEffect } from 'react';

export default function usePageTitle(title: string) {
  useEffect(
    () => {
      document.title = title;
    },
    [title],
  );
}
