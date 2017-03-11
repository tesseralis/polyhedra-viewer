import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { setFilterText } from '../actions'
import { getFilterText } from '../reducers/filter'
import SearchBar from '../components/SearchBar'

const FilterBar = ({ text, setFilterText }) => (
  <SearchBar text={text} setValue={setFilterText} />
)

const mapStateToProps = state => ({
  text: getFilterText(state.filter)
})

const mapDispatchToProps = dispatch => bindActionCreators({ setFilterText }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterBar)

