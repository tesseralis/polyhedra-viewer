// @flow
import _ from 'lodash';
import periodicTable from 'constants/periodicTable';
import { toConwayNotation } from './names';
import { mapObject } from 'util.js';

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
  if ('dgpu'.includes(operation)) return operation;
  if (operation === '+') return '-';
  if (operation === '-') return '+';
  if ('ta'.includes(operation)) return 'k';
  if ('es'.includes(operation)) return 'c';
  if ('PA'.includes(operation)) return 'h';
  throw new Error(`Invalid operation: ${operation}`);
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
        if (operation === 'g' && sink.direction) {
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
      const colName = _.isObject(column) ? column.name : column;
      result[row][colName] = table.data[i][j];
    });
  });
  return result;
}

const invalidNames = ['concave', 'coplanar'];
function convertTableNotation(notation) {
  if (_.isArray(notation)) return notation.map(convertTableNotation);
  if (notation[0] === '!') return notation.substring(1);
  if (_.includes(invalidNames, notation)) return null;
  return notation;
}

function convertTable(table) {
  if (!table.data) return table;
  return {
    ...table,
    data: table.data.map(row => row.map(convertTableNotation)),
  };
}

const [, prisms, , pyramidsCupolae, augmentations] = periodicTable
  .map(convertTable)
  .map(getKeyedTable);

const hasCupolaRotunda = name =>
  name.includes('pentagonal') && !name.includes('pyramid');
const cupolaRotunda = pyramidsCupolae['cupola-rotunda'];

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
    getOrthoGyroAugment(pyramidsCupolae[rowName][colName], using),
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
    P: { using: prism, value: pValue },
    A: { using: antiprism, value: aValue, gyrate, chiral },
  };
};

// TODO: adapt this from the table to we don't miss anything
const archimedean = {
  T: {
    d: 'T',
    t: 'tT',
    a: 'O',
    e: 'aC',
    s: 'I',
  },
  C: {
    d: 'O',
    t: 'tC',
    a: 'aC',
    e: 'eC',
    s: { value: 'sC', chiral: true },
  },
  O: {
    t: 'tO',
    a: 'aC',
    e: 'eC',
    s: { value: 'sC', chiral: true },
  },
  aC: {
    // TODO (possibly) coxeter snub (semi-snub) and rectify relations
    t: 'bC',
    // p: 'I',
  },
  eC: {
    // p: 'sC',
  },
  D: {
    d: 'I',
    t: 'tD',
    a: 'aD',
    e: 'eD',
    s: { value: 'sD', chiral: true },
  },
  I: {
    t: 'tI',
    a: 'aD',
    e: 'eD',
    s: { value: 'sD', chiral: true },
  },
  aD: {
    t: 'bD',
  },
  eD: {
    // p: 'sD',
  },
};

const basePyramidsCupolae = (() => {
  let graph = {};
  // relation of prisms and antiprisms
  _.forEach(prisms, (row, name) => {
    const { prism, antiprism } = row;
    const hasRotunda = name.startsWith('decagonal');
    const pyramidRow = getPyramidFromPrism(name);
    const { elongated, gyroelongated } = pyramidsCupolae[pyramidRow];
    const rotundaRow = pyramidsCupolae['pentagonal rotunda'];
    const using = getPyramidCupolaConway(pyramidRow);
    graph = graphMerge(graph, {
      [prism]: {
        '+': [
          { value: elongated, using },
          hasRotunda && { value: rotundaRow.elongated, using: 'R5' },
        ],
        u: antiprism,
      },
      [antiprism]: {
        '+': [
          { value: gyroelongated, using },
          hasRotunda && { value: rotundaRow.gyroelongated, using: 'R5' },
        ],
      },
    });
  });
  // for diminished icosahedra
  graph['A5']['+'][0].align = 'para';

  _.forEach(pyramidsCupolae, (row, name) => {
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
        '+': augmentations(name, 'bi-'),
      },
      [elongated]: {
        '+': augmentations(name, 'elongated bi-'),
        u: gyroelongated,
      },
      [gyroelongated]: {
        '+': augmentations(name, 'gyroelongated bi-'),
      },
      [gyroelongatedBi]: {
        g: _.isArray(bi) ? { value: gyroelongatedBi } : null,
      },
    });

    if (!_.isArray(bi)) {
      graph = graphMerge(graph, {
        [bi]: elongations(elongatedBi, gyroelongatedBi),
        [elongatedBi]: {
          u: gyroelongatedBi,
        },
      });
    } else {
      const [ortho, gyro] = bi;
      const [elongBiOrtho, elongBiGyro] = elongatedBi;
      graph = graphMerge(graph, {
        [ortho]: elongations(elongBiOrtho, gyroelongatedBi, 'ortho', true),
        [gyro]: elongations(elongBiGyro, gyroelongatedBi, 'gyro', true),
      });
    }

    // gyrate relationships
    _.forEach(row, cell => {
      if (_.isArray(cell)) {
        const [ortho, gyro] = cell;
        graph = graphMerge(graph, {
          [ortho]: {
            g: gyro,
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
  _.forEach(augmentations, (row, name) => {
    const base = toConwayNotation(name);
    const { augmented, biaugmented, triaugmented } = row;
    const augmentee = getAugmentee(name);
    graph = graphMerge(graph, {
      [base]: {
        '+': { using: augmentee, value: augmented },
      },
      [augmented]: {
        '+': getBiAugmented(biaugmented, augmentee),
      },
      [_.isArray(biaugmented) ? biaugmented[1] : biaugmented]: {
        '+': { using: augmentee, value: triaugmented },
      },
    });
  });
  return graph;
})();

const diminishedIcosahedraGraph = (() => {
  return {
    J63: {
      '+': [{ using: 'Y3', value: 'J64' }, { using: 'Y5', value: 'J62' }],
    },
    J62: {
      '+': { using: 'Y5', align: 'meta', value: 'J11' },
    },
  };
})();

const rhombicosidodecahedraGraph = (() => {
  const getAugment = relations =>
    relations.map(relation => ({ ...relation, using: 'U5' }));
  const getGyrate = relations =>
    relations.map(relation => ({ ...relation, direction: 'forward' }));
  return {
    // tridiminished
    J83: {
      '+': getAugment([
        { value: 'J81', gyrate: 'gyro' },
        { value: 'J82', gyrate: 'ortho' },
      ]),
    },
    // bidiminished
    J81: {
      '+': getAugment([
        { value: 'J76', gyrate: 'gyro', align: 'meta' },
        { value: 'J78', gyrate: 'ortho' },
      ]),
      g: getGyrate([{ value: 'J82' }]),
    },
    J82: {
      '+': getAugment([
        { value: 'J78', gyrate: 'gyro' },
        { value: 'J79', gyrate: 'ortho' },
      ]),
    },
    J80: {
      '+': getAugment([
        { value: 'J76', gyrate: 'gyro', align: 'para' },
        { value: 'J77', gyrate: 'ortho' },
      ]),
    },
    // diminished
    J76: {
      '+': getAugment([
        { value: 'eD', gyrate: 'gyro' },
        { value: 'J72', gyrate: 'ortho' },
      ]),
      g: getGyrate([
        { value: 'J77', align: 'para' },
        { value: 'J78', align: 'meta' },
      ]),
    },
    J77: {
      '+': getAugment([
        { value: 'J72', gyrate: 'gyro', align: 'para' },
        { value: 'J73', gyrate: 'ortho' },
      ]),
    },
    J78: {
      '+': getAugment([
        { value: 'J72', gyrate: 'gyro', align: 'meta' },
        { value: 'J74', gyrate: 'ortho' },
      ]),
      g: getGyrate([{ value: 'J79' }]),
    },
    J79: {
      '+': getAugment([
        { value: 'J74', gyrate: 'gyro' },
        { value: 'J75', gyrate: 'ortho' },
      ]),
    },

    // gyrate
    eD: {
      g: getGyrate([{ value: 'J72' }]),
    },
    J72: {
      g: getGyrate([
        { value: 'J73', align: 'para' },
        { value: 'J74', align: 'meta' },
      ]),
    },
    J74: {
      g: getGyrate([{ value: 'J75' }]),
    },
  };
})();

const othersGraph = (() => {
  const empty = mapObject(_.range(87, 93), j => [`J${j}`, {}]);
  return {
    ...empty,
    // TODO semisnub to create snub antiprisms
    // snub antiprisms
    // T: {
    //   s: 'J84',
    // },
    // A4: {
    //   s: 'J85',
    // },
    J84: {},
    J85: {},

    // other johnson solids
    J86: {
      '+': { using: 'Y4', value: 'J87' },
    },
  };
})();

const normalized = [
  archimedean,
  basePyramidsCupolae,
  baseAugmentations,
  diminishedIcosahedraGraph,
  rhombicosidodecahedraGraph,
  othersGraph,
]
  .map(normalize)
  .map(compact);

export default makeBidirectional(graphMergeAll(...normalized));
