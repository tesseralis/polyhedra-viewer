import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { setFilterText } from '../actions'
import { getFilterText } from '../selectors'
import SearchBar from '../components/SearchBar'

const mapStateToProps = state => ({
  text: getFilterText(state)
})

const mapDispatchToProps = dispatch => bindActionCreators({
  setValue: setFilterText,
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchBar)

