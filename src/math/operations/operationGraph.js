// @flow strict
import _ from 'lodash';
import { prisms, capstones, augmented } from 'constants/polyhedronTables';
import { toConwayNotation } from 'polyhedra/names';
import { mapObject } from 'utils';

// Make everything an array
function normalize(graph) {
  return _.mapValues(graph, ops =>
    _.mapValues(ops, relations => {
      return _.castArray(relations).map(
        relation => (_.isObject(relation) ? relation : { value: relation }),
      );
    }),
  );
}

function compact(graph) {
  return _.mapValues(graph, ops =>
    _(ops)
      .mapValues(options => {
        return _.filter(options, option => !!option.value);
      })
      .pickBy('length')
      .value(),
  );
}

const customizer = (objValue, srcValue) => {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
};

function graphMerge(object, other) {
  return _.mergeWith(object, other, customizer);
}

function graphMergeAll(...objects) {
  return _.reduce(objects, graphMerge);
}

const getInverseOperation = operation => {
  switch (operation) {
    case 'dual':
    case 'gyrate':
    case 'twist':
    case 'turn':
      return operation;
    case 'augment':
      return 'diminish';
    case 'diminish':
      return 'augment';
    case 'truncate':
    case 'rectify':
      return 'sharpen';
    case 'expand':
    case 'snub':
      return 'contract';
    case 'elongate':
    case 'gyroelongate':
      return 'shorten';
    default:
      throw new Error(`Invalid operation: ${operation}`);
  }
};

function makeBidirectional(graph) {
  const result = {};
  for (let [source, operations] of _.entries(graph)) {
    for (let [operation, sinks] of _.entries(operations)) {
      for (let sink of sinks) {
        const sinkValue = sink.value;
        if (!sinkValue) {
          continue;
        }
        if (!result[sinkValue]) {
          result[sinkValue] = {};
        }
        const reverseOp = getInverseOperation(operation);
        if (!result[sinkValue][reverseOp]) {
          result[sinkValue][reverseOp] = [];
        }
        if (sinkValue === source) {
          continue;
        }
        const newValue = { ...sink, value: source };
        if (operation === 'gyrate' && sink.direction) {
          newValue.direction = 'back';
        }
        result[sinkValue][reverseOp].push(newValue);
      }
    }
  }
  return graphMerge(result, graph);
}

function getKeyedTable(table) {
  const result = {};
  if (!table.rows) return result;
  table.rows.forEach((row, i) => {
    result[row] = {};
    table.columns.forEach((column, j) => {
      const colName = typeof column === 'object' ? column.name : column;
      result[row][colName] = table.data[i][j];
    });
  });
  return result;
}

const invalidNames = ['concave', 'coplanar'];
function convertTableNotation(notation) {
  if (Array.isArray(notation)) return notation.map(convertTableNotation);
  if (notation[0] === '!') return notation.substring(1);
  if (_.includes(invalidNames, notation)) return null;
  return notation;
}

function convertTable(table) {
  return {
    ...table,
    data: table.data.map(row => row.map(convertTableNotation)),
  };
}

const [prismMap, capstoneMap, augmentationMap] = [prisms, capstones, augmented]
  .map(convertTable)
  .map(getKeyedTable);

const hasCupolaRotunda = name =>
  name.includes('pentagonal') && !name.includes('pyramid');
const cupolaRotunda = capstoneMap['cupola-rotunda'];

const getOrthoGyroAugment = (value, using) => {
  if (!_.isArray(value)) {
    return [{ using, value }];
  } else {
    return [
      { using, value: value[0], gyrate: 'ortho' },
      { using, value: value[1], gyrate: 'gyro' },
    ];
  }
};

const getCupolaRotunda = (using, colName) => {
  const altUsing = using.includes('U') ? 'R5' : 'U5';
  return getOrthoGyroAugment(cupolaRotunda[colName], altUsing);
};

const getAugmentations = using => (rowName, colName) => {
  return _([
    getOrthoGyroAugment(capstoneMap[rowName][colName], using),
    hasCupolaRotunda(rowName) && getCupolaRotunda(using, colName),
  ])
    .flatten()
    .compact()
    .value();
};

const nameMapping = {
  digonal: 2,
  triangular: 3,
  square: 4,
  pentagonal: 5,
  hexagonal: 6,
  octagonal: 8,
  decagonal: 10,
};
const divName = name => {
  const m = nameMapping[name];
  if (m <= 5) return name;
  return _.invert(nameMapping)[m / 2];
};

const getPyramidFromPrism = prismRow => {
  const isPyramid = _.includes(
    ['triangular', 'square', 'pentagonal'],
    prismRow,
  );
  return `${divName(prismRow)} ${isPyramid ? 'pyramid' : 'cupola'}`;
};

const getPrismFromPyramid = (name, anti) => {
  const [prefix, type] = name.split(' ');
  const isCupola = _.includes(['cupola', 'rotunda', 'cupola-rotunda'], type);
  const index = nameMapping[prefix] * (isCupola ? 2 : 1);
  return `${anti ? 'A' : 'P'}${index}`;
};

const pyramidCupolaConway = {
  pyramid: 'Y',
  cupola: 'U',
  rotunda: 'R', // not official, I don't think
};

const getPyramidCupolaConway = name => {
  const [sides, type] = name.split(' ');
  return `${pyramidCupolaConway[type]}${nameMapping[sides]}`;
};

const getElongations = (prism, antiprism) => (
  pValue,
  aValue,
  gyrate,
  chiral,
) => {
  return {
    elongate: { value: pValue },
    gyroelongate: { value: aValue, gyrate, chiral },
  };
};

const archimedean = {
  T: {
    dual: 'T',
    truncate: 'tT',
    rectify: 'O',
    expand: 'aC',
    snub: 'I',
  },
  C: {
    dual: 'O',
    truncate: 'tC',
    rectify: 'aC',
    expand: 'eC',
    snub: { value: 'sC', chiral: true },
  },
  O: {
    truncate: 'tO',
    rectify: 'aC',
    expand: 'eC',
    snub: { value: 'sC', chiral: true },
  },
  aC: {
    // TODO (possibly) coxeter snub (semi-snub) and rectify relations
    truncate: 'bC',
    twist: 'I',
  },
  eC: {
    twist: { value: 'sC', chiral: true },
  },
  D: {
    dual: 'I',
    truncate: 'tD',
    rectify: 'aD',
    expand: 'eD',
    snub: { value: 'sD', chiral: true },
  },
  I: {
    truncate: 'tI',
    rectify: 'aD',
    expand: 'eD',
    snub: { value: 'sD', chiral: true },
  },
  aD: {
    truncate: 'bD',
  },
  eD: {
    twist: { value: 'sD', chiral: true },
  },
};

const baseCapstones = (() => {
  let graph = {};
  // relation of prisms and antiprisms
  _.forEach(prismMap, (row, name) => {
    const { prism, antiprism } = row;
    const hasRotunda = name.startsWith('decagonal');
    const pyramidRow = getPyramidFromPrism(name);
    const { elongated, gyroelongated } = capstoneMap[pyramidRow];
    const rotundaRow = capstoneMap['pentagonal rotunda'];
    const using = getPyramidCupolaConway(pyramidRow);
    graph = graphMerge(graph, {
      [prism]: {
        augment: [
          { value: elongated, using },
          hasRotunda && { value: rotundaRow.elongated, using: 'R5' },
        ],
        turn: antiprism,
      },
      [antiprism]: {
        augment: [
          { value: gyroelongated, using },
          hasRotunda && { value: rotundaRow.gyroelongated, using: 'R5' },
        ],
      },
    });
  });
  // for diminished icosahedra
  graph['A5']['augment'][0].align = 'para';

  _.forEach(capstoneMap, (row, name) => {
    const {
      '--': base,
      elongated,
      gyroelongated,
      'bi-': bi,
      'elongated bi-': elongatedBi,
      'gyroelongated bi-': gyroelongatedBi,
    } = row;
    const prism = getPrismFromPyramid(name);
    const antiprism = getPrismFromPyramid(name, true);
    const conway = getPyramidCupolaConway(name);
    const elongations = getElongations(prism, antiprism);
    const augmentations = getAugmentations(conway);
    graph = graphMerge(graph, {
      [base]: {
        ...elongations(elongated, gyroelongated),
        augment: augmentations(name, 'bi-'),
      },
      [elongated]: {
        augment: augmentations(name, 'elongated bi-'),
        turn: gyroelongated,
      },
      [gyroelongated]: {
        augment: augmentations(name, 'gyroelongated bi-'),
      },
      [gyroelongatedBi]: {
        gyrate: _.isArray(bi) ? { value: gyroelongatedBi } : null,
      },
    });

    if (!_.isArray(bi)) {
      graph = graphMerge(graph, {
        [bi]: elongations(elongatedBi, gyroelongatedBi),
        [elongatedBi]: {
          turn: gyroelongatedBi,
        },
      });
    } else {
      const [ortho, gyro] = bi;
      const [elongBiOrtho, elongBiGyro] = elongatedBi;
      graph = graphMerge(graph, {
        [ortho]: elongations(elongBiOrtho, gyroelongatedBi, 'ortho', true),
        [gyro]: elongations(elongBiGyro, gyroelongatedBi, 'gyro', true),
        [elongBiOrtho]: {
          turn: { value: gyroelongatedBi, gyrate: 'ortho', chiral: true },
        },
        [elongBiGyro]: {
          turn: { value: gyroelongatedBi, gyrate: 'gyro', chiral: true },
        },
      });
    }

    // gyrate relationships
    _.forEach(row, cell => {
      if (_.isArray(cell)) {
        const [ortho, gyro] = cell;
        graph = graphMerge(graph, {
          [ortho]: {
            gyrate: gyro,
          },
        });
      }
    });
  });

  return graph;
})();

const getAugmentee = name => {
  if (name.includes('prism')) return 'Y4';
  if (name === 'dodecahedron') return 'Y5';
  const type = name.split(' ')[1];
  switch (type) {
    case 'tetrahedron':
      return 'U3';
    case 'cube':
      return 'U4';
    case 'dodecahedron':
      return 'U5';
    default:
      return null;
  }
};

const getBiAugmented = (biaugmented, using) => {
  if (!_.isArray(biaugmented)) {
    return [{ using, value: biaugmented }];
  }
  return [
    { using, value: biaugmented[0], align: 'para' },
    { using, value: biaugmented[1], align: 'meta' },
  ];
};

const baseAugmentations = (() => {
  let graph = {};
  _.forEach(augmentationMap, (row, name) => {
    const base = toConwayNotation(name);
    const { augmented, biaugmented, triaugmented } = row;
    const augmentee = getAugmentee(name);
    graph = graphMerge(graph, {
      [base]: {
        augment: { using: augmentee, value: augmented },
      },
      [augmented]: {
        augment: getBiAugmented(biaugmented, augmentee),
      },
      [_.isArray(biaugmented) ? biaugmented[1] : biaugmented]: {
        augment: { using: augmentee, value: triaugmented },
      },
    });
  });
  return graph;
})();

const diminishedIcosahedra = (() => {
  return {
    J63: {
      augment: [{ using: 'Y3', value: 'J64' }, { using: 'Y5', value: 'J62' }],
    },
    J62: {
      augment: { using: 'Y5', align: 'meta', value: 'J11' },
    },
  };
})();

const rhombicosidodecahedra = (() => {
  const getAugment = relations =>
    relations.map(relation => ({ ...relation, using: 'U5' }));
  const getGyrate = relations =>
    relations.map(relation => ({ ...relation, direction: 'forward' }));
  return {
    // tridiminished
    J83: {
      augment: getAugment([
        { value: 'J81', gyrate: 'gyro' },
        { value: 'J82', gyrate: 'ortho' },
      ]),
    },
    // bidiminished
    J81: {
      augment: getAugment([
        { value: 'J76', gyrate: 'gyro', align: 'meta' },
        { value: 'J78', gyrate: 'ortho' },
      ]),
      gyrate: getGyrate([{ value: 'J82' }]),
    },
    J82: {
      augment: getAugment([
        { value: 'J78', gyrate: 'gyro' },
        { value: 'J79', gyrate: 'ortho' },
      ]),
    },
    J80: {
      augment: getAugment([
        { value: 'J76', gyrate: 'gyro', align: 'para' },
        { value: 'J77', gyrate: 'ortho' },
      ]),
    },
    // diminished
    J76: {
      augment: getAugment([
        { value: 'eD', gyrate: 'gyro' },
        { value: 'J72', gyrate: 'ortho' },
      ]),
      gyrate: getGyrate([
        { value: 'J77', align: 'para' },
        { value: 'J78', align: 'meta' },
      ]),
    },
    J77: {
      augment: getAugment([
        { value: 'J72', gyrate: 'gyro', align: 'para' },
        { value: 'J73', gyrate: 'ortho' },
      ]),
    },
    J78: {
      augment: getAugment([
        { value: 'J72', gyrate: 'gyro', align: 'meta' },
        { value: 'J74', gyrate: 'ortho' },
      ]),
      gyrate: getGyrate([{ value: 'J79' }]),
    },
    J79: {
      augment: getAugment([
        { value: 'J74', gyrate: 'gyro' },
        { value: 'J75', gyrate: 'ortho' },
      ]),
    },

    // gyrate
    eD: {
      gyrate: getGyrate([{ value: 'J72' }]),
    },
    J72: {
      gyrate: getGyrate([
        { value: 'J73', align: 'para' },
        { value: 'J74', align: 'meta' },
      ]),
    },
    J74: {
      gyrate: getGyrate([{ value: 'J75' }]),
    },
  };
})();

const elementary = (() => {
  const empty = mapObject(_.range(87, 93), j => [`J${j}`, {}]);
  return {
    ...empty,
    // TODO semisnub to create snub antiprisms
    // snub antiprisms
    // T: {
    //   snub: 'J84',
    // },
    // A4: {
    //   snub: 'J85',
    // },
    J84: {},
    J85: {},

    // other johnson solids
    J86: {
      augment: { using: 'Y4', value: 'J87' },
    },
  };
})();

const normalized = [
  archimedean,
  baseCapstones,
  baseAugmentations,
  diminishedIcosahedra,
  rhombicosidodecahedra,
  elementary,
]
  .map(normalize)
  .map(compact);

export default makeBidirectional(graphMergeAll(...normalized));
