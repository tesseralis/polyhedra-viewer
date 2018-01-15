import React from 'react'
import { withRouter, Route } from 'react-router-dom'
import { css, StyleSheet } from 'aphrodite/no-important'

import { IconLink } from './menuIcons'
import ConfigForm from './ConfigForm'
import RelatedPolyhedra from './RelatedPolyhedra'
import PolyhedronList from './PolyhedronList'

const ComponentInfo = ({ match }) => {
  return <div>This is a {match.params.solid}</div>
}

// TODO figure out how not to have this match weaved in all the time
// (In general, try to figure out a better way to do routing)
const Sidebar = ({ match }) => {
  const styles = StyleSheet.create({
    sidebar: {
      width: 400,
      height: '100%',
      overflowY: 'scroll',
      backgroundColor: 'WhiteSmoke',
      boxShadow: 'inset -1px -1px 4px LightGray',
    },
    menu: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  })

  return (
    <section className={css(styles.sidebar)}>
      <div className={css(styles.menu)}>
        <IconLink to={`${match.url}`} name="info" />
        <IconLink to={`${match.url}/related`} name="link" />
        <IconLink to={`${match.url}/config`} name="cog" />
        <IconLink to={`${match.url}/list`} name="list" />
        <IconLink to="/" name="home" />
      </div>
      {/* TODO don't hardcode the absolute path */}
      <Route exact path={`/:solid`} component={ComponentInfo} />
      <Route path={`/:solid/related`} component={RelatedPolyhedra} />
      <Route path={`${match.url}/config`} component={ConfigForm} />
      <Route path={`${match.url}/list`} component={PolyhedronList} />
    </section>
  )
}

export default withRouter(Sidebar)
