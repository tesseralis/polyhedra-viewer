// @flow strict
// Markdown for everything.

export const abstract = `
For centuries, mathematicians and artists have been fascinated by the
beauty in polyhedra -- three dimensional shapes made of simple polygons.
But the majority of us have only heard and seen a few of them, like the
Platonic Solids, or prisms, or pyramids. There are many more polyhedra
to find, with interesting properties and relationships to each other.

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

export const uniform = `
A polyhedron is _uniform_ if its vertices are transitive. These include the regular
Platonic solids, which only have one type of face, and the semi-regular Archimedean solids,
prisms, and antiprisms, which have more than one type of face.
`;

export const johnson = `
The 92 Johnson solids, named after Norman Johnson, are the *nonuniform*
convex regular-faced polyhedra -- polyhedra whose vertices aren't completely symmetrical.
All but a few of them can be created by "cut-and-paste" operations on the uniform polyhedra.

Even though there is no hard restriction, it turns out that you can make all
the Johnson solids using faces of 3, 4, 5, 6, 8 or 10 sides.
`;

export const capstones = `

The majority of Johnson solids are made of these components:

* **pyramid** - a set of triangles around a point with a regular polygon base.
   These can be sliced off from the tetrahedron, octahedron, and icosahedron
* **cupola** - A set of alternating squares and triangles around a top polygon,
   with a base that has double the amount of sides. These can be "sliced" off the "rhombi-" solids
* **rotunda** - Alternating sets of triangles and pentagons. Half of an icosidodecahedron.

The following operations are defined:
* **elongate** - Extend this solid with a prism
* **gyroelongate** - Extend this solid with an antiprism
* **bi** - Glue two solids together

Cupolae and rotundae can be oriented two different ways -
_Ortho-_ means that opposite faces are aligned with each other.
_Gyro-_ means that they are skew.
`;

export const cutPaste = `
The next group of Johnson solids are defined by doing the following operations on
Platonic and Archimedean solids:

* **augment** - add a pyramid or cupola
* **diminish** - diminish a pyramid or cupola
* **gyrate** - rotate a cupola

When two operations are applied, sometimes there is more than one way to do it.
Like in molecular chemistry, we name a solid _para-_ if the two modified components
are opposite each other, and _meta-_ if they are not.

Remember that Johnson solids must be convex -- which means that an operation is not
possible if it would make the dihedral angle between two faces more than 180 degrees.
`;

export const elementary = `
The remaining Johnson solids cannot be created by "cut and paste" operations.
Of those, two of them can be created by snubbing antiprisms (not supported in this
app). The rest we have no idea and are just kinda random. Isn't that crazy?
`;
