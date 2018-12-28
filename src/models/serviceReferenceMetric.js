/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import moment from 'moment';
import {query} from '../services/graphql';
import {generateModal} from '../utils/models';
import {generateDuration} from '../utils/time';

const optionsQuery = `
  query ApplicationOption($duration: Duration!) {
    applicationId: getAllApplication(duration: $duration) {
      key: id
      label: name
    }
  }
`;

const dataQuery = `query ServiceReferenceMetricBrief($condition: ServiceReferenceMetricQueryCondition) {
  queryServiceReferenceMetricBrief(condition: $condition){
    serviceReferenceMetrics {
        id
        calls
        errorCalls
        averageDuration
        behindServiceInfo {
            id
            name
            applicationName
            applicationId
        }
        frontServiceInfo {
            id
            name
            applicationName
            applicationId
        }
    }
    total
  }
}`;

const spanQuery = `query ServiceReferenceMetricBrief($condition: ServiceReferenceMetricQueryCondition) {
  queryServiceReferenceMetricBrief(condition: $condition){
    serviceReferenceMetrics {
        id
        calls
        errorCalls
        averageDuration
        behindServiceInfo {
            id
            name
            applicationName
            applicationId
        }
        frontServiceInfo {
            id
            name
            applicationName
            applicationId
        }
    }
    total
  }
}`;

export default generateModal({
    namespace: 'serviceReferenceMetric',
    state: {
        queryServiceReferenceMetricBrief: {
            serviceReferenceMetrics: []
        },
    },
    varState: {
        values: {
            duration: generateDuration({
                from() {
                    return moment().subtract(15, 'minutes');
                },
                to() {
                    return moment();
                },
            }),
            queryOrder: 'BY_TIME_BUCKET',
        },
    },
    defaultOption: {
        serviceId: {
            label: 'All Service',
        },
    },
    optionsQuery,
    dataQuery,
    effects: {
        *fetchSpans({payload}, {call, put}) {
            const response = yield call(query, {query: spanQuery, variables: payload.variables});
            yield put({
                type: 'saveSpans',
                payload: response,
            });
        },
    },
    reducers: {
        saveSpans(state, {payload, traceId}) {
            const {data} = state;
            return {
                ...state,
                data: {
                    ...data,
                    queryServiceReferenceMetricBrief: payload.data.queryServiceReferenceMetricBrief
                },
            };
        },
    },
    subscriptions: {
        setup({history, dispatch}) {
            return history.listen(({pathname, state}) => {
                if (pathname === '/serviceReferenceMetric' && state) {
                    const {queryOrder = 'BY_TIME_BUCKET'} = state;
                    dispatch({
                        type: 'initVariables',
                        payload: {
                            values: {...state.values, queryOrder},
                            labels: state.labels,
                        },
                    });
                }
            });
        },
    },
});
