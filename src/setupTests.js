import { configure } from 'enzyme'
// import Adapter from 'enzyme-adapter-react-16'
import { StyleSheetTestUtils } from 'aphrodite'
import Adapter from './ReactSixteenAdapter'

configure({ adapter: new Adapter() })
StyleSheetTestUtils.suppressStyleInjection()
