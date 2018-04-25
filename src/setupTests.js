import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { StyleSheetTestUtils } from 'aphrodite';

configure({ adapter: new Adapter() });
StyleSheetTestUtils.suppressStyleInjection();
