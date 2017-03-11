import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar'
import FilterBar from './FilterBar'
import { getFilteredGroups } from '../reducers'

const mapStateToProps = state => ({
  groups: getFilteredGroups(state),
  searchBar: FilterBar,
})

export default connect(mapStateToProps)(Sidebar)
