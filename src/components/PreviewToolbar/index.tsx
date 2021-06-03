import { useEffect, useRef } from 'react';

export const PreviewToolbar = (): JSX.Element => {
  const toolbar = useRef<HTMLScriptElement>();

  useEffect(() => {
    toolbar.current.setAttribute('async', 'true');
    toolbar.current.setAttribute('defer', 'true');
    toolbar.current.src =
      'https://static.cdn.prismic.io/prismic.js?new=true&repo=bloggprosjekt';
  }, []);

  return <script ref={toolbar} />;
};
