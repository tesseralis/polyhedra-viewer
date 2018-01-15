import React, { Component } from 'react'
import * as THREE from 'three'
import TrackballControls from './TrackballControls'

// https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_draggablecubes.html
export default class ThreeScene extends Component {
  componentDidMount() {
    this.init()
    this.animate()
  }

  render() {
    return <div ref={container => (this.container = container)} />
  }

  init = () => {
    const camera = (this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    ))
    camera.position.z = 1000

    const scene = (this.scene = new THREE.Scene())
    scene.background = new THREE.Color(0xf0f0f0)

    // FIXME replace with the actual solid
    const geometry = new THREE.BoxGeometry(40, 40, 40)
    const object = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }),
    )
    scene.add(object)

    const controls = (this.controls = new TrackballControls(camera))
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.panSpeed = 0.8
    controls.noZoom = false
    controls.noPan = false
    controls.staticMoving = true
    controls.dynamicDampingFactor = 0.3

    var light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(1, 1, 1).normalize()
    scene.add(light)

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
