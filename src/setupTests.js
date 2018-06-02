// @flow
import { configure } from 'enzyme';
// import Adapter from 'enzyme-adapter-react-16';
import Adapter from './ReactSixteenAdapter';
import { StyleSheetTestUtils } from 'aphrodite';

configure({ adapter: new Adapter() });
jest.mock('x3dom.js');
StyleSheetTestUtils.suppressStyleInjection();
