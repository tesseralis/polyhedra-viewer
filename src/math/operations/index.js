// @flow strict
import _ from 'lodash';
import { dual } from './dual';
import { truncate, rectify } from './truncate';
import { cumulate } from './cumulate';
import { expand, snub } from './expand';
import { contract } from './contract';
import { augment, elongate, gyroelongate } from './augment';
import { diminish, shorten } from './diminish';
import { gyrate } from './gyrate';
import { normalizeOperation } from './operationUtils';

const rawOps = {
    dual,
    truncate,
    rectify,
    cumulate,
    expand,
    snub,
    contract,
    augment,
    elongate,
    gyroelongate,
    diminish,
    shorten,
    gyrate,
};

export const operations = _.mapValues(rawOps, normalizeOperation);

export type { OpName, OperationResult } from './operationTypes';
