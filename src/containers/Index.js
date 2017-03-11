import { connect } from 'react-redux'

import { getFilteredGroups } from '../reducers'
import Table from '../components/Table'
import FilterBar from './FilterBar'

const mapStateToProps = state => ({
  groups: getFilteredGroups(state),
  searchBar: FilterBar
})

export default connect(mapStateToProps)(Table)
