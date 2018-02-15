import _ from 'lodash'
import periodicTable from 'constants/periodicTable'
import { fromConwayNotation, toConwayNotation } from './names'

export const operations = [
  {
    name: 'truncate',
    symbol: 't',
    description: 'Cut and create a new face at each vertex.',
  },
  {
    name: 'rectify',
    symbol: 'a',
    description: 'Cut (truncate) each vertex at the midpoint of each edge.',
  },
  {
    name: 'cumulate',
    symbol: 'k',
    description: 'Opposite of truncation. Append a pyramid at certain faces.',
  },
  {
    name: 'dual',
    symbol: 'd',
    description: 'Replace each face with a vertex.',
  },
  {
    name: 'expand',
    symbol: 'e',
    description: 'Pull out faces, creating new square faces.',
  },
  {
    name: 'snub',
    symbol: 's',
    description: 'Pull out and twist faces, creating new triangular faces.',
  },
  {
    name: 'contract',
    symbol: 'c',
    description: 'Opposite of expand/snub. Shrink faces in, removing faces.',
  },
  {
    name: 'elongate',
    symbol: 'P',
    description: 'Extend with a prism.',
  },
  {
    name: 'gyroelongate',
    symbol: 'A',
    description: 'Extend with an antiprism.',
  },
  {
    name: 'shorten',
    symbol: 'h',
    description: 'Remove a prism or antiprism',
  },
  {
    name: 'twist',
    symbol: 'p',
    description:
      'Replace each square face with two triangular faces, or vice versa.',
  },
  {
    name: 'augment',
    symbol: '+',
    description: 'Append a pyramid, cupola, or rotunda.',
  },
  {
    name: 'diminish',
    symbol: '-',
    description: 'Remove a pyramid, cupola, or rotunda.',
  },
  {
    name: 'gyrate',
    symbol: 'g',
    description: 'Rotate a cupola or rotunda.',
  },
]

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
    a: 'tC',
    r: 'aC',
    e: 'eC',
    s: 'sC',
  },
  O: {
    t: 'tO',
    a: 'aC',
    e: 'eC',
    s: 'sC',
  },
  aC: {
    // TODO (possibly) coxeter snub and rectify relations
    t: 'bC',
    p: 'I',
  },
  eC: {
    p: 'sC',
  },
  D: {
    d: 'D',
    t: 'tD',
    a: 'aD',
    e: 'eD',
    s: 'sD',
  },
  I: {
    t: 'tI',
    a: 'aD',
    e: 'eD',
    s: 'sD',
  },
  aD: {
    a: 'bD',
  },
  eD: {
    p: 'sD',
  },
}

// Make everything an array
function normalize(graph) {
  return _.mapValues(graph, ops =>
    _.mapValues(ops, relations => {
      return _.castArray(relations).map(
        relation => (_.isObject(relation) ? relation : { value: relation }),
      )
    }),
  )
}

function compact(graph) {
  return _.mapValues(graph, ops =>
    _(ops)
      .mapValues(options => {
        return _.filter(options, option => !_.isNil(option.value))
      })
      .pickBy('length')
      .value(),
  )
}

const customizer = (objValue, srcValue) => {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue)
  }
}
function graphMerge(object, ...other) {
  return _.mergeWith(object, ...other, customizer)
}

const getInverseOperation = operation => {
  switch (operation) {
    // dual
    case 'd':
    case 'g':
    case 'p':
      return operation
    // agument / diminish
    case '+':
      return '-'
    case '-':
      return '+'
    case 't':
    case 'a':
      return 'k'
    case 'e':
    case 's':
      return 'c'
    case 'P':
    case 'A':
      return 'h'
    default:
      return `~${operation}`
  }
}

function makeBidirectional(graph) {
  const result = {}
  for (let [source, operations] of Object.entries(graph)) {
    for (let [operation, sinks] of Object.entries(operations)) {
      for (let sink of sinks) {
        const sinkValue = sink.value
        if (!sinkValue) {
          continue
        }
        if (!result[sinkValue]) {
          result[sinkValue] = {}
        }
        const reverseOp = getInverseOperation(operation)
        if (!result[sinkValue][reverseOp]) {
          result[sinkValue][reverseOp] = []
        }
        if (sinkValue === source) {
          continue
        }
        const newValue = { ...sink, value: source }
        if (operation === 'g' && sink.direction) {
          newValue.direction = 'back'
        }
        result[sinkValue][reverseOp].push(newValue)
      }
    }
  }
  return graphMerge(result, graph)
}

function getKeyedTable(table) {
  const result = {}
  if (!table.rows) return result
  table.rows.forEach((row, i) => {
    result[row] = {}
    table.columns.forEach((column, j) => {
      const colName = _.isObject(column) ? column.name : column
      result[row][colName] = table.data[i][j]
    })
  })
  return result
}

const invalidNames = ['concave', 'coplanar']
function convertTableNotation(notation) {
  if (_.isArray(notation)) return notation.map(convertTableNotation)
  if (notation[0] === '!') return notation.substring(1)
  if (_.includes(invalidNames, notation)) return null
  return notation
}

function convertTable(table) {
  if (!table.data) return table
  return {
    ...table,
    data: table.data.map(row => row.map(convertTableNotation)),
  }
}

const [, prisms, , pyramidsCupolae, augmentations] = periodicTable
  .map(convertTable)
  .map(getKeyedTable)

const hasCupolaRotunda = name =>
  name.includes('pentagonal') && !name.includes('pyramid')
const cupolaRotunda = pyramidsCupolae['cupola-rotunda']

const getOrthoGyroAugment = (value, using) => {
  if (!_.isArray(value)) {
    return [{ using, value }]
  } else {
    return [
      { using, value: value[0], gyrate: 'ortho' },
      { using, value: value[1], gyrate: 'gyro' },
    ]
  }
}

const getCupolaRotunda = (using, colName) => {
  const altUsing = using.includes('U') ? 'R5' : 'U5'
  return getOrthoGyroAugment(cupolaRotunda[colName], altUsing)
}

const getAugmentations = using => (rowName, colName) => {
  return _([
    getOrthoGyroAugment(pyramidsCupolae[rowName][colName], using),
    hasCupolaRotunda(rowName) && getCupolaRotunda(using, colName),
  ])
    .flatten()
    .compact()
    .value()
}

const nameMapping = {
  digonal: 2,
  triangular: 3,
  square: 4,
  pentagonal: 5,
  hexagonal: 6,
  octagonal: 8,
  decagonal: 10,
}
const divName = name => {
  const m = nameMapping[name]
  if (m <= 5) return name
  return _.invert(nameMapping)[m / 2]
}

const getPyramidFromPrism = prismRow => {
  const isPyramid = _.includes(['triangular', 'square', 'pentagonal'], prismRow)
  return `${divName(prismRow)} ${isPyramid ? 'pyramid' : 'cupola'}`
}

const getPrismFromPyramid = (name, anti) => {
  const [prefix, type] = name.split(' ')
  const isCupola = _.includes(['cupola', 'rotunda', 'cupola-rotunda'], type)
  const index = nameMapping[prefix] * (isCupola ? 2 : 1)
  return `${anti ? 'A' : 'P'}${index}`
}

const pyramidCupolaConway = {
  pyramid: 'Y',
  cupola: 'U',
  rotunda: 'R', // not official, I don't think
}

const getPyramidCupolaConway = name => {
  const [sides, type] = name.split(' ')
  return `${pyramidCupolaConway[type]}${nameMapping[sides]}`
}

const getElongations = (prism, antiprism) => (pValue, aValue) => {
  return {
    P: { using: prism, value: pValue },
    A: { using: antiprism, value: aValue },
  }
}

const basePyramidsCupolae = (() => {
  let graph = {}
  // relation of prisms and antiprisms
  _.forEach(prisms, (row, name) => {
    const { prism, antiprism } = row
    const hasRotunda = name.startsWith('decagonal')
    const pyramidRow = getPyramidFromPrism(name)
    const { elongated, gyroelongated } = pyramidsCupolae[pyramidRow]
    const rotundaRow = pyramidsCupolae['pentagonal rotunda']
    const using = getPyramidCupolaConway(pyramidRow)
    const augmentations = getAugmentations(using)
    graph = graphMerge(graph, {
      [prism]: {
        '+': [
          { value: elongated, using },
          hasRotunda && { value: rotundaRow.elongated, using: 'R5' },
        ],
      },
      [antiprism]: {
        '+': [
          { value: gyroelongated, using },
          hasRotunda && { value: rotundaRow.gyroelongated, using: 'R5' },
        ],
      },
    })
  })
  // for diminished icosahedra
  graph['A5']['+'][0].align = 'para'

  _.forEach(pyramidsCupolae, (row, name) => {
    const {
      base,
      elongated,
      gyroelongated,
      'bi-': bi,
      'elongated bi-': elongatedBi,
      'gyroelongated bi-': gyroelongatedBi,
    } = row
    const prism = getPrismFromPyramid(name)
    const antiprism = getPrismFromPyramid(name, true)
    const conway = getPyramidCupolaConway(name)
    const elongations = getElongations(prism, antiprism)
    const augmentations = getAugmentations(conway)
    graph = graphMerge(graph, {
      [base]: {
        ...elongations(elongated, gyroelongated),
        '+': augmentations(name, 'bi-'),
      },
      [elongated]: {
        '+': augmentations(name, 'elongated bi-'),
      },
      [gyroelongated]: {
        '+': augmentations(name, 'gyroelongated bi-'),
      },
      [gyroelongatedBi]: {
        g: _.isArray(bi) ? { value: gyroelongatedBi } : null,
      },
    })

    // TODO Populate elongations of bipyramids (which we may not even do?)
    // if (!_.isArray(bi)) {
    //   graph = graphMerge(graph, {
    //     [bi]: elongations(elongatedBi, gyroelongatedBi),
    //   })
    // } else {
    //   const [ortho, gyro] = bi
    //   const [elongBiOrtho, elongBiGyro] = elongatedBi
    //   graph = graphMerge(graph, {
    //     [ortho]: elongations(elongBiOrtho, gyroelongatedBi),
    //     [gyro]: elongations(elongBiGyro, gyroelongatedBi),
    //   })
    // }

    // gyrate relationships
    _.forEach(row, cell => {
      if (_.isArray(cell)) {
        const [ortho, gyro] = cell
        graph = graphMerge(graph, {
          [ortho]: {
            g: gyro,
          },
        })
      }
    })
  })

  return graph
})()

const getAugmentee = name => {
  if (name.includes('prism')) return 'Y4'
  if (name === 'dodecahedron') return 'Y5'
  const type = name.split(' ')[1]
  switch (type) {
    case 'tetrahedron':
      return 'U3'
    case 'cube':
      return 'U4'
    case 'dodecahedron':
      return 'U5'
    default:
      return null
  }
}

const getBiAugmented = (biaugmented, using) => {
  if (!_.isArray(biaugmented)) {
    return [{ using, value: biaugmented }]
  }
  return [
    { using, value: biaugmented[0], align: 'para' },
    { using, value: biaugmented[1], align: 'meta' },
  ]
}

const baseAugmentations = (() => {
  let graph = {}
  _.forEach(augmentations, (row, name) => {
    const base = toConwayNotation(name)
    const { augmented, biaugmented, triaugmented } = row
    const augmentee = getAugmentee(name)
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
    })
  })
  return graph
})()

const diminishedIcosahedraGraph = (() => {
  return {
    J63: {
      '+': [{ using: 'Y3', value: 'J64' }, { using: 'Y5', value: 'J62' }],
    },
    J62: {
      '+': { using: 'Y5', align: 'meta', value: 'J11' },
    },
  }
})()

const rhombicosidodecahedraGraph = (() => {
  const getAugment = relations =>
    relations.map(relation => ({ ...relation, using: 'U5' }))
  const getGyrate = relations =>
    relations.map(relation => ({ ...relation, direction: 'forward' }))
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
  }
})()

const othersGraph = (() => {
  return {
    // snub antiprisms
    T: {
      s: 'J84',
    },
    A4: {
      s: 'J85',
    },

    // "other" johnson solids
    J86: {
      '+': { using: 'Y4', value: 'J87' },
    },
  }
})()

const normalized = [
  archimedean,
  basePyramidsCupolae,
  baseAugmentations,
  diminishedIcosahedraGraph,
  rhombicosidodecahedraGraph,
  othersGraph,
]
  .map(normalize)
  .map(compact)

const baseGraph = graphMerge(...normalized)
export const polyhedraGraph = makeBidirectional(baseGraph)

// Get the operations that can be applied to the given solid
export function getOperations(solid) {
  return _.keys(polyhedraGraph[toConwayNotation(solid)])
}

export function getRelations(solid, operation) {
  return polyhedraGraph[toConwayNotation(solid)][operation]
}

const defaultAugmentees = {
  3: 'Y3',
  4: 'Y4',
  5: 'Y5',
  6: 'U3',
  8: 'U4',
  10: 'U5',
}

const augmenteeSides = {
  ..._.invert(defaultAugmentees),
  U2: 4,
  R5: 10,
}

export function getUsingOpts(solid) {
  const augments = getRelations(solid, '+')
  const using = _.uniq(_.map(augments, 'using'))
  const grouped = _.groupBy(using, option => augmenteeSides[option])
  return _.find(grouped, group => group.length > 1) || []
}

export function getUsingOpt(using, numSides) {
  return using && augmenteeSides[using] === numSides
    ? using
    : defaultAugmentees[numSides]
}

// Get the polyhedron name as a result of applying the operation to the given polyhedron
export function getNextPolyhedron(solid, operation, filterOpts) {
  const next = _(polyhedraGraph[toConwayNotation(solid)][operation])
    .filter(!_.isEmpty(filterOpts) ? filterOpts : _.stubTrue)
    .value()
  if (next.length > 1) {
    throw new Error(
      `Multiple possibilities found for operation ${operation} on ${solid} with options ${JSON.stringify(
        filterOpts,
      )}: ${JSON.stringify(next)}`,
    )
  } else if (next.length === 0) {
    throw new Error(
      `No possibilities found for operation ${operation} on ${solid} with options ${JSON.stringify(
        filterOpts,
      )}. Are you sure you didn't put in too many?`,
    )
  }

  return fromConwayNotation(next[0].value)
}
