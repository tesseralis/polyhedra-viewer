import React, { Component } from 'react'
import * as THREE from 'three'
import * as _ from 'lodash'
import TrackballControls from './TrackballControls'

function toTriangles(polygon) {
  const [p0, ...ps] = polygon
  return _(ps)
    .initial()
    .map((pn, i) => [p0, pn, ps[i + 1]])
    .value()
}

function getGeometry(solid) {
  const vertices = _.flatten(solid.vertices)
  const faces = _.flattenDeep(solid.faces.map(toTriangles))
  return new THREE.PolyhedronGeometry(vertices, faces, 0, 0)
}

// https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_draggablecubes.html
export default class ThreeScene extends Component {
  componentDidMount() {
    this.init()
    this.animate()
  }

  render() {
    return <div ref={container => (this.container = container)} />
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.solid === nextProps.solid) {
      return
    }
    const { solid } = nextProps
    this.object.geometry = getGeometry(solid)
  }

  init = () => {
    const { solid } = this.props
    const camera = (this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    ))
    camera.position.z = 5

    const scene = (this.scene = new THREE.Scene())
    scene.background = new THREE.Color(0xf0f0f0)

    const object = (this.object = new THREE.Mesh(
      getGeometry(solid),
      new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }),
    ))
    scene.add(object)

    const controls = (this.controls = new TrackballControls(camera))
    controls.rotateSpeed = 4.0
    controls.zoomSpeed = 1.2
    controls.panSpeed = 0.8
    controls.noZoom = false
    controls.noPan = false
    controls.staticMoving = true
    controls.dynamicDampingFactor = 0.3

    var light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(1, 1, 1).normalize()
    camera.add(light)
    scene.add(camera)

    const renderer = (this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    }))
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    this.container.appendChild(renderer.domElement)
  }

  animate = () => {
    requestAnimationFrame(this.animate)
    this.doRender()
    // stats.update()
  }

  doRender = () => {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
