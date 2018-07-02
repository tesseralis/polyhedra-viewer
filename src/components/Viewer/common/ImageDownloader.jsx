// @flow
import * as React from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { escapeName } from 'polyhedra/names';
import { allSolidNames } from 'data';
import { WithPolyhedron } from '../context';

class ImageDownloader extends React.Component<*> {
  downloadImages = () => {
    const zip = new JSZip();
    const canvas = document.getElementsByTagName('canvas');
    const ratio = canvas[0].width / canvas[0].height;
    canvas[0].height = 200;
    canvas[0].width = ratio * 200;

    const images = zip.folder('images');
    const tasks = allSolidNames.map(solid => () =>
      this.addImage(canvas, images, solid),
    );

    let result = Promise.resolve();
    tasks.forEach(task => {
      result = result.then(() => task());
    });
    result.then(() => {
      zip.generateAsync({ type: 'blob' }).then(content => {
        FileSaver.saveAs(content, 'images.zip');
      });
    });
  };

  addImage = (canvas, folder, solid) => {
    const { setPolyhedron } = this.props;
    return new Promise(resolve => {
      setPolyhedron(solid, () => {
        canvas[0].toBlob(v => {
          folder.file(`${escapeName(solid)}.png`, v, { base64: true });
          resolve();
        });
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
