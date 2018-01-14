import React from 'react'
import { withRouter, Route } from 'react-router-dom'
import { css, StyleSheet } from 'aphrodite/no-important'

import { IconLink } from './menuIcons'
import ConfigForm from './ConfigForm'
import PolyhedronList from './PolyhedronList'

const ComponentInfo = () => {
  return <div>This is a polyhedron</div>
}

// FIXME figure out how not to have this match weaved in all the time
// FIXME factor out the components
const Sidebar = ({ match }) => {
  const styles = StyleSheet.create({
    sidebar: {
      width: 400,
      height: '100%',
      overflowY: 'scroll',
      backgroundColor: 'WhiteSmoke',
      boxShadow: 'inset -1px -1px 4px LightGray',
    },
  })

  return (
    <section className={css(styles.sidebar)}>
      <div>
        <IconLink to={`${match.url}`} name="info" />
        <IconLink to={`${match.url}/list`} name="list" />
        <IconLink to={`${match.url}/related`} name="link" />
        <IconLink to={`${match.url}/config`} name="cog" />
        <IconLink to="/" name="home" />
      </div>
      <Route exact path={`${match.url}`} component={ComponentInfo} />
      <Route path={`${match.url}/list`} component={PolyhedronList} />
      <Route path={`${match.url}/config`} component={ConfigForm} />
    </section>
  )
}

export default withRouter(Sidebar)
