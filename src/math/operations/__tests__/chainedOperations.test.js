import { Polyhedron } from 'math/polyhedra';
import { operations } from 'math/operations';
import { setupOperations } from '../operationTestUtils';

setupOperations();

describe('chained tests', () => {
  const tests = [
    {
      description: 'combining twist and turn operations',
      start: 'elongated pentagonal bipyramid',
      operations: [
        ['turn', 'icosahedron'],
        ['twist', 'cuboctahedron'],
        ['twist', 'icosahedron'],
        ['turn', 'elongated pentagonal bipyramid'],
      ],
    },
    {
      description: 'augmenting and contracting icosahedron',
      start: 'gyroelongated pentagonal pyramid',
      operations: [
        { op: 'augment', args: { n: 5 }, expected: 'icosahedron' },
        ['contract', 'tetrahedron'],
      ],
    },
    {
      description: 'rhombicuboctahedron expansion/contraction',
      start: 'cube',
      operations: [
        ['expand', 'rhombicuboctahedron'],
        { op: 'contract', args: { faceType: 4 }, expected: 'cube' },
        ['expand', 'rhombicuboctahedron'],
        { op: 'contract', args: { faceType: 3 }, expected: 'octahedron' },
      ],
    },
    {
      description: 'dodecahedron -> rectify -> sharpen -> contract',
      start: 'dodecahedron',
      operations: [
        ['rectify', 'icosidodecahedron'],
        { op: 'sharpen', args: { faceType: 5 }, expected: 'icosahedron' },
        ['contract', 'tetrahedron'],
      ],
    },
    {
      description: 'truncation and rectification',
      start: 'tetrahedron',
      operations: [
        ['truncate', 'truncated tetrahedron'],
        ['sharpen', 'tetrahedron'],
        ['rectify', 'octahedron'],
        ['rectify', 'cuboctahedron'],
        ['truncate', 'truncated cuboctahedron'],
        ['sharpen', 'cuboctahedron'],
        { op: 'sharpen', args: { faceType: 3 }, expected: 'cube' },
        ['truncate', 'truncated cube'],
        {
          op: 'augment',
          args: { n: 8 },
          expected: 'augmented truncated cube',
        },
      ],
    },
  ];

  function getArgs(args, polyhedron) {
    if (args.n) {
      return { face: polyhedron.faceWithNumSides(args.n) };
    }
    return args;
  }

  function getOpInfo(opInfo, polyhedron) {
    if (Array.isArray(opInfo)) {
      return { op: operations[opInfo[0]], expected: opInfo[1] };
    }
    const { op, args, expected } = opInfo;
    return {
      op: operations[op],
      expected,
      args: getArgs(args, polyhedron),
    };
  }

  tests.forEach(test => {
    const { start, description, operations } = test;
    let polyhedron = Polyhedron.get(start);
    let solidName = start;
    it(description, () => {
      operations.forEach(opInfo => {
        const { op, args, expected } = getOpInfo(opInfo, polyhedron);
        const result = op.apply(polyhedron, args);
        expect(result).toBeValidPolyhedron();

        polyhedron = result.result;
        expect(polyhedron.name).toBe(expected);
        solidName = result.name;
      });
    });
  });
});
