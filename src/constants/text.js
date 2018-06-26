// @flow strict
// Markdown for everything.

export const abstract = `
For centuries, mathematicians and artists have been fascinated by the
beauty in polyhedra—three dimensional shapes made of simple polygons.
But most are familiar with only a few of them, such as the
Platonic solids, prisms, or pyramids. There are many more polyhedra
to discover, with interesting properties and relationships to each other.

This interactive encyclopedia cataloges the relationships between
the convex, regular-faced (CRF) polyhedra.
The 120 solids presented here are connected to each other by an intricate
network of operations. Select a solid to manipulate it and to see its
relationships with other polyhedra.

[Platonic solids]: http://en.wikipedia.org/wiki/Platonic_solid
[Archimedean solids]: http://en.wikipedia.org/wiki/Archimedean_solid
[prisms]: http://en.wikipedia.org/wiki/Prism_(geometry)
[antiprisms]: http://en.wikipedia.org/wiki/Antiprism
[Johnson solids]: http://en.wikipedia.org/wiki/Johnson_solid
`;

export const uniform = `
A polyhedron is _uniform_ if its vertices are transitive. These include the regular
Platonic solids, which only have one type of face, and the semi-regular Archimedean solids,
prisms, and antiprisms, which have more than one type of face.

The Archimedean solids can be constructed from the Platonic solids by a set of operations:

* **truncate** - Cut each vertex off the solid leaving equal sized faces
* **rectify** - Cut each vertex off the solid at the midpoint
* **expand** - Pull the faces of the solid out
* **snub** - Pull the faces of the solid out and twist them

There are infinitely many prisms and antiprisms, one for each type of polygon.
A select few are included here because of their relationship to the Johnson solids.
`;

export const johnson = `
The 92 Johnson solids, named after Norman Johnson, are the *nonuniform*
convex regular-faced polyhedra—polyhedra whose vertices aren't completely symmetrical.
All but a few of them can be created by "cut-and-paste" operations on the uniform polyhedra.

Even though there is no hard restriction on which polygons can be used,
all the Johnson solids can be made using faces of 3, 4, 5, 6, 8 or 10 sides.
`;

export const capstones = `

The majority of Johnson solids are made of these components:

* **pyramid** - a set of triangles around a point with a regular polygon base.
   These can be sliced off from the tetrahedron, octahedron, and icosahedron
* **cupola** - A set of alternating squares and triangles around a top polygon,
   with a base that has double the amount of sides. These can be sliced off the cantellated
   Archimedean solids.
* **rotunda** - Alternating sets of triangles and pentagons. Half of an icosidodecahedron.

The following operations are defined:
* **elongate** - Extend this solid with a prism
* **gyroelongate** - Extend this solid with an antiprism
* **bi** - Glue two solids together

Cupolae and rotundae can be oriented two different ways:
_ortho-_ means that opposite faces are aligned with each other, while
_gyro-_ means that they are skew.
`;

export const cutPaste = `
The next group of Johnson solids are defined by doing the following operations on
Platonic and Archimedean solids:

* **augment** - add a pyramid or cupola
* **diminish** - diminish a pyramid or cupola
* **gyrate** - rotate a cupola

When more than one operation is applied, sometimes there is more than one way in which
the solid can be modified. A solid _para-_ if the modified components
are opposite each other, and _meta-_ if they are not.

Johnson solids are, by definition, convex—an operation is not possible if
it would make the dihedral angle between two faces more than 180 degrees.
For example, the pentagonal prism cannot be augmented more than twice because there
is no place to put another pyramid without making it nonconvex.
`;

export const elementary = `
The remaining Johnson solids cannot be created by "cut and paste" operations.
Of those, two of them can be created by applying the semisnub operation to antiprisms.

The remaining seven are named based on their components:

* **lune** - two triangles on opposite ends of a square
* **spheno-** - two adjacent lunes that make a wedge
* **hebespheno-** - two lunes separated by a third lune
* **-corona** - a crownlike complex of eight triangles
* **-megacorona** - a crownlike complex of 12 triangles
* **-cingulum** - a belt of 12 triangles

While they are not directly composed of other polyhedra, these solids may still be
have interesting relationships with other solids. For example, the bilunabirotunda
makes a [honeycomb] with the cube and dodecahedron.

[honeycomb]: https://en.wikipedia.org/wiki/Regular_dodecahedron#Space_filling_with_cube_and_bilunabirotunda
`;

export const more = `
Wow wasn't that a trip! Again, these are only the _convex_, _regular-faced_ polyhedra.
There are many more! The [Kepler-Poinsot polyhedra] are like the Platonic solids but non-convex.
The [Catalan solids] are the duals of the Archimedian solids and have non-regular faces.

And that's only in three dimensions! Try exploring the four dimentional [polychora]
(if you can wrap your head around it) or even [higher dimensions][5-polytope]!

[Kepler-Poinsot polyhedra]: https://en.wikipedia.org/wiki/Kepler%E2%80%93Poinsot_polyhedron
[Catalan solids]: https://en.wikipedia.org/wiki/Catalan_solid
[5-polytope]: https://en.wikipedia.org/wiki/5-polytope
`;
