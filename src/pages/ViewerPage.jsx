// @flow
import { Polyhedron, Face } from 'math/polyhedra';
import AppPage, { type PageOptions } from './AppPage';

function splitListOfLists(listStr, outerSep, innerSep) {
  return listStr
    .split(outerSep)
    .map(inner => inner.split(innerSep).map(parseFloat));
}

export default class ViewerPage extends AppPage {
  constructor(
    solid: string,
    panel?: string = 'operations',
    options: PageOptions = {},
  ) {
    super(`/${solid}/${panel}`, options);
  }

  getPolyhedron() {
    const vertexStr = this.wrapper
      .find('coordinate')
      .first()
      .prop('point');
    const vertices = splitListOfLists(vertexStr, ', ', ' ');

    const faceStr = this.wrapper.find('indexedfaceset').prop('coordindex');
    const faces = splitListOfLists(faceStr, ' -1 ', ' ');

    const name = this.wrapper
      .find('Title')
      .text()
      .toLowerCase();

    return new Polyhedron({ name, vertices, faces });
  }

  clickFace(face: Face) {
    const hitPnt = face.centroid().toArray();
    const shape = this.wrapper
      .find('shape')
      .filterWhere(n => !!n.prop('onMouseMove'));
    shape.simulate('mousemove', { hitPnt });
    shape.simulate('mousedown', { hitPnt });
    shape.simulate('mouseup', { hitPnt });
    return this;
  }

  clickAnyFace() {
    return this.clickFace(this.getPolyhedron());
  }

  clickFaceWithNumSides(n: number) {
    return this.clickFace(this.getPolyhedron().faceWithNumSides(n));
  }

  expectOperation(operation: ?string) {
    const button = this.wrapper
      .find('OpGrid')
      .find('OpButton')
      .filterWhere(n => !!n.prop('highlighted'));
    const actual = button.length ? button.prop('name') : '';
    expect(actual).toEqual(operation);
    return this;
  }

  expectPath(path: string) {
    const viewer = this.wrapper.find('Viewer');
    const history = viewer.prop('history');
    expect(history.location.pathname).toEqual(path);
    return this;
  }

  expectTransitionTo(expected: string) {
    this.wrapper.update();
    this.expectPath(`/${expected}/operations`);
    expect(this.getPolyhedron().isSame(Polyhedron.get(expected))).toBe(true);
    return this;
  }

  goBack() {
    const viewer = this.wrapper.find('Viewer');
    const history = viewer.prop('history');
    history.goBack();
    this.wrapper.update();
    return this;
  }
}
