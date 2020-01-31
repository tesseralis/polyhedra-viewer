import _ from 'lodash';
import React from 'react';
import { createMemoryHistory, History } from 'history';
import { Router } from 'react-router-dom';

import { mount, ReactWrapper } from 'enzyme';

import App from 'components/App';

jest.mock('components/useMediaInfo');

const { DeviceProvider } = require('components/useMediaInfo');

export interface PageOptions {
  device?: string;
  orientation?: string;
}

export default class AppPage {
  wrapper: ReactWrapper;
  history: History;

  constructor(path: string = '/', options: PageOptions = {}) {
    const { device = 'desktop', orientation = '' } = options;
    const mediaInfo = { device, orientation };
    this.history = createMemoryHistory();
    this.history.push(path);
    this.wrapper = mount(
      <DeviceProvider value={mediaInfo}>
        <Router history={this.history}>
          <App />
        </Router>
      </DeviceProvider>,
    );
  }

  expectPath(path: string) {
    expect(this.history.location.pathname).toEqual(path);
    return this;
  }

  goBack() {
    this.history.goBack();
    this.wrapper.update();
    return this;
  }

  findElementWithText(element: string, text: string) {
    return this.wrapper.find(element).filterWhere(n => n.text().includes(text));
  }

  expectElementWithText(element: string, text: string) {
    expect(this.findElementWithText(element, text)).toHaveLength(1);
    return this;
  }

  expectNoElementWithText(element: string, text: string) {
    expect(this.findElementWithText(element, text)).toHaveLength(0);
    return this;
  }

  // Find a (not disabled) button with the given text
  findButtonWithText(text: string) {
    return this.wrapper
      .find('button')
      .filterWhere(n => n.text() === text && !n.prop('disabled'));
  }

  clickButtonWithText(text: string): this {
    this.findButtonWithText(text).simulate('click');
    return this;
  }

  expectNoButtonWithText(text: string) {
    expect(this.findButtonWithText(text)).toHaveLength(0);
    return this;
  }

  findLinkWithText(text: string) {
    return this.wrapper.find('a').filterWhere(n => n.text() === text);
  }

  clickLinkWithText(text: string): this {
    this.findLinkWithText(text).simulate('click', { button: 0 });
    return this;
  }
}
