import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { setFilterText } from '../actions'
import { getFilterText } from '../reducers'
import SearchBar from '../components/SearchBar'

const FilterBar = ({ filterText, setFilterText }) => (
  <SearchBar text={filterText} setValue={setFilterText} />
)

const mapStateToProps = state => ({
  filterText: getFilterText(state)
})

const mapDispatchToProps = dispatch => bindActionCreators({ setFilterText }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterBar)

