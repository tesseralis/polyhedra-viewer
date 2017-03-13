import { connect } from 'react-redux'

import { getFilteredGroups } from '../selectors'
import Table from '../components/Table'
import SearchBar from './SearchBar'

const mapStateToProps = state => ({
  groups: getFilteredGroups(state),
  searchBar: SearchBar
})

export default connect(mapStateToProps)(Table)
