import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar'
import { getFilteredGroups } from '../reducers'

const mapStateToProps = state => ({
  groups: getFilteredGroups(state),
})

export default connect(mapStateToProps)(Sidebar)
