import * as React from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { escapeName } from 'math/polyhedra/names';
import { allSolidNames } from 'data';

/**
 * Utility class to download image thumbnails. Do NOT use in production
 */
// TODO rebuild this class with hoooks~~
export default class ImageDownloader extends React.Component<any> {
  downloadImages = async () => {
    const zip = new JSZip();
    const canvas = document.getElementsByTagName('canvas');
    const ratio = canvas[0].width / canvas[0].height;
    const height = 150;
    canvas[0].height = height;
    canvas[0].width = ratio * height;

    const images = zip.folder('images');

    for (let solid of allSolidNames) {
      await this.addImage(canvas, images, solid);
    }
    zip.generateAsync({ type: 'blob' }).then(content => {
      FileSaver.saveAs(content, 'images.zip');
    });
  };

  addImage = async (canvas: any, folder: any, solid: any) => {
    const { setPolyhedron } = this.props;
    return await new Promise(resolve => {
      setPolyhedron(solid, () => {
        setTimeout(() => {
          canvas[0].toBlob((v: any) => {
            folder.file(`${escapeName(solid)}.png`, v, { base64: true });
            resolve();
          });
        }, 100);
      });
    });
  };

  render() {
    return <button onClick={this.downloadImages}>download images</button>;
  }
}
