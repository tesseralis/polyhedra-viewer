// @flow
import * as React from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { WithPolyhedron } from '../context';
import { allSolidNames } from 'data';

class ImageDownloader extends React.Component<*> {
  downloadImages = () => {
    const zip = new JSZip();
    const { solid, setPolyhedron } = this.props;
    const canvas = document.getElementsByTagName('canvas');

    // allSolidNames.forEach(solid => {
    //   setPolyhedron(solid);
    // });

    canvas[0].toBlob(v => {
      const images = zip.folder('images');
      images.file(`${solid}.png`, v, { base64: true });

      zip.generateAsync({ type: 'blob' }).then(content => {
        FileSaver.saveAs(content, 'images.zip');
      });
    });
  };

  render() {
    return <button onClick={this.downloadImages}>download images</button>;
  }
}

export default () => {
  return (
    <WithPolyhedron>
      {({ setPolyhedron }) => <ImageDownloader setPolyhedron={setPolyhedron} />}
    </WithPolyhedron>
  );
};
