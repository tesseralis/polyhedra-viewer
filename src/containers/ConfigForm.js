import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ConfigForm from '../components/ConfigForm'
import { getConfigValues } from '../reducers'
import { setInputValue, reset } from '../actions'

const mapStateToProps = state => ({
  configValues: getConfigValues(state),
})

const mapDispatchToProps = dispatch => bindActionCreators({
  setInputValue,
  reset
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ConfigForm)
