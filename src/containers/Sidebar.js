import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar'
import SearchBar from './SearchBar'
import { getFilteredGroups } from '../selectors'

const mapStateToProps = state => ({
  groups: getFilteredGroups(state),
  searchBar: SearchBar,
})

export default connect(mapStateToProps)(Sidebar)
