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
import { notification } from 'antd';

const dataQuery = `query load($applicationCode: String,$paging: Pagination!) {
  getApplication(applicationCode: $applicationCode,paging:$paging){
    items {
        id
        name
    }
    total
  }
}`;

const spanQuery = `query load($applicationCode: String,$paging: Pagination!) {
  getApplication(applicationCode: $applicationCode,paging:$paging){
    items {
        id
        name
    }
    total
  }
}`;

const alarmQuery = `query load{
    loadAllAlarmContact{
        id
        realName
        email
    }
}`;

const selectAlarmQuery = `query load($applicationId: Int!){
    loadApplicationAlarmContact(applicationId: $applicationId){
        id
        realName
        phoneNumber
        email
    }
}`;

const editQuery = `mutation set($alarmContactIds: [Int!]!,$applicationId: Int!) {
  setApplicationAlarmContact(alarmContactIds: $alarmContactIds ,applicationId: $applicationId){
    errCode
  }
}`;

export default generateModal({
    namespace: 'applicationManager',
    state: {
        getApplication: {
            applications: []
        },
        showEditor: false,
        loadAllAlarmContact: [],
        loadApplicationAlarmContact: [], //选中的联系人
        loadApplicationAlarmContactId: [], //选中的联系人id数组
        editApplicationId: ''
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
    dataQuery,
    effects: {
        *fetchSpans({payload}, {call, put}) {
            const response = yield call(query, {query: spanQuery, variables: payload.variables});
            yield put({
                type: 'saveSpans',
                payload: response,
            });
        },
        *fetchAlarm({payload}, {call, put}) {
            const response = yield call(query, 'applicationManager', {query: alarmQuery});
            yield put({
                type: 'alarmData',
                payload: response,
            });
        },
        *fetchSelectAlarm({payload}, {call, put}) {
            const response = yield call(query, 'applicationManager', {query: selectAlarmQuery, variables: payload});
            yield put({
                type: 'selectAlarmData',
                payload: response,
            });
        },
        *fetchEdit({payload}, {call, put}) {
            const response = yield call(query, 'applicationManager', {query: editQuery, variables: payload});
            yield put({
                type: 'eidtData',
                payload: response,
            });
        },
    },
    reducers: {
        saveSpans(state, {payload}) {
            const {data} = state;
            return {
                ...state,
                data: {
                    ...data,
                    getApplication: payload.data.getApplication
                },
            };
        },
        alarmData(preState, { payload }){
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    loadAllAlarmContact: payload.data.loadAllAlarmContact
                },
            };
        },
        selectAlarmData(preState, { payload }){
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    loadApplicationAlarmContact: payload.data.loadApplicationAlarmContact,
                    loadApplicationAlarmContactId: payload.data.loadApplicationAlarmContact.map(item=>item.id)
                },
            };
        },
        setEditApplication(preState, {payload}) {
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    editApplicationId: payload.applicationId
                },
            };
        },
        editorSelectId(preState, {payload}) {
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    loadApplicationAlarmContactId: payload.loadApplicationAlarmContactId
                },
            };
        },
        eidtData(preState, { payload }) {
            const { data } = preState;
            if(payload.data.setApplicationAlarmContact.errCode === 0){
                notification.success({
                    message: '设置成功'
                });
            } else {
                notification.error({
                    message: '设置成功'
                });
            }
            return {
                ...preState,
                data: {
                    ...data,
                    showEditor: false,
                },
            };
        },
        showEditor(preState) {
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    showEditor: true,
                },
            };
        },
        hideEditor(preState) {
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    showEditor: false,
                },
            };
        },
    },
    subscriptions: {
        setup({history, dispatch}) {
            return history.listen(({pathname, state}) => {
                if (pathname === '/applicationManager' && state) {
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
