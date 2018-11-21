


import { useEffect } from 'react';

export default function usePageTitle(title: string) {
  // "This is broken because it doesn't have a cleanup function,
  // so the page title is stuck... but it's going to be annoying
  // to make it work." -- Dan Abramov
  useEffect(
    () => {
      document.title = title;
    },
    [title],
  );
}
