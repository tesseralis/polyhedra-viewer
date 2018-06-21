// @flow strict
// Markdown for everything.

export const abstract = `
  These tables are a categorization of the convex, regular-faced (CRF)
  polyhedra. These include the five [Platonic solids][platonic], the 13
  [Archimedean solids][archimedean], the infinite set of [prisms][prism]
  and [antiprisms][antiprism], and the 92 [Johnson solids][johnson].
  The 120 solids presented here are connected to each other by an intricate
  network of operations. Select a solid to manipulate it and to see its
  relationships with other polyhedra.

  [platonic]: http://en.wikipedia.org/wiki/Platonic_solid
  [archimedean]: http://en.wikipedia.org/wiki/Archimedean_solid
  [prism]: http://en.wikipedia.org/wiki/Prism_(geometry)
  [antiprism]: http://en.wikipedia.org/wiki/Antiprism
  [johnson]: http://en.wikipedia.org/wiki/Johnson_solid
`;

export const johnson = `
  The 92 Johnson solids are the *nonuniform* convex regular-faced polyhedra --
  polyhedra whose vertices aren't completely symmetrical. Norman Johnson named
  and enumerated these in 1966. All but a few of them can be created by
  "cut-and-paste" operations on the uniform polyhedra.

  Even though there is no hard restriction, it turns out that you can make all
  the Johnson solids using faces of 3, 4, 5, 6, 8 or 10 sides. This is why we only
  have those prisms and antiprisms in the list.
`;

export const capstones = `

The majority of Johnson solids are made of these components:

* **Pyramid** - a set of triangles around a point with a regular polygon base.
   These can be sliced off from the tetrahedron, octahedron, and icosahedron
* **Cupola** - A set of alternating squares and triangles around a top polygon,
   with a base that has double the amount of sides. These can be "sliced" off the "rhombi-" solids
* **Rotunda** - Alternating sets of triangles and pentagons. Half of an icosidodecahedron.

The following operations are defined:
* **Elongate** - Extend this solid with a prism
* **Gyroelongate** - Extend this solid with an antiprism
* **Bi-** - Glue two solids together
	* **Ortho/gyro** - Cupolae and rotundae can be oriented two different ways -
     ortho means that opposite faces are aligned with each other. Gyro means that they are skew
	* **Cupola-rotunda** - A rotunda and pentagonal cupola can be attached to each other,
     creating a class of solids called cupola-rotundae

Some of the Platonic and Archimedean solids can expressed with this naming scheme.
For example, a rhombicuboctahedron is an "elongated square orthobicupola".
These solids are indicated by being grayed out.

The gyrobifastigium -- two triangular prisms attached to each other, is a special case.
The triangular prism can be considered a "digonal cupola", a cupola with a 2-sided top.
Johnson named it "fastigium" to make it confusing to everyone.
`;
