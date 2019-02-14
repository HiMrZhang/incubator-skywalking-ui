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

const optionsQuery = `
  query ApplicationOption($duration: Duration!) {
    applicationId: getAllApplication(duration: $duration) {
      key: id
      label: name
    }
  }
`;

const dataQuery = `query aa($keyword: String, $paging: Pagination!) {
  loadAlarmContactList(keyword: $keyword, paging: $paging){
    items {
        id
        realName
        phoneNumber
        email
    }
    total
  }
}`;

const spanQuery = `query aa($keyword: String, $paging: Pagination!) {
  loadAlarmContactList(keyword: $keyword, paging: $paging){
    items {
        id
        realName
        phoneNumber
        email
    }
    total
  }
}`;

const addAlarmQuery = `mutation add($email: String!,$phoneNumber: String!,$realName: String!) {
  addAlarmContact(email: $email ,phoneNumber: $phoneNumber,realName: $realName){
    errCode
  }
}`;

const editAlarmQuery = `mutation edit($id: String!$email: String,$phoneNumber: String,$realName: String) {
  editAlarmContact(id:$id,email: $email ,phoneNumber: $phoneNumber,realName: $realName){
    errCode
  }
}`;

const deleteAlarmQuery = `mutation delete($alarmContactId: Int!) {
  deleteAlarmContact(alarmContactId:$alarmContactId){
    errCode
  }
}`;

export default generateModal({
    namespace: 'alarmContact',
    state: {
        loadAlarmContactList: {
            alarmContacts: []
        },
        showEditor: false,
        editorUser: {}
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
    editAlarmQuery,
    effects: {
        *fetchSpans({payload}, {call, put}) {
            const response = yield call(query, {query: spanQuery, variables: payload.variables});
            yield put({
                type: 'saveSpans',
                payload: response,
            });
        },
        *fetchAddAlarm({payload}, {call, put}) {
            const response = yield call(query, 'alarmContact', {query: addAlarmQuery, variables: payload});
            yield put({
                type: 'addData',
                payload: response.data,
            });
        },
        *fetchEditAlarm({payload}, {call, put}) {
            const response = yield call(query, 'alarmContact', {query: editAlarmQuery, variables: payload});
            if (!response.data) {
                return;
            }
            yield put({
                type: 'editData',
                payload: response.data,
            });
        },
        *fetchDeleteAlarm({payload}, {call, put}) {
            const response = yield call(query, 'alarmContact', {query: deleteAlarmQuery, variables: payload});
            if (!response.data) {
                return;
            }
            yield put({
                type: 'deleteData',
                payload: response.data,
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
                    loadAlarmContactList: payload.data.loadAlarmContactList
                },
            };
        },
        addData(preState, { payload }) {
            const { data } = preState;
            if(payload.addAlarmContact.errCode === 0){
                notification.success({
                    message: '添加成功'
                });
            } else {
                notification.error({
                    message: '添加失败'
                });
            }
            return {
                ...preState,
                data: {
                    ...data,
                    showEditor: false,
                    editorUser: {}
                },
            };
        },
        editData(preState, { payload }) {
            const { data } = preState;
            if(payload.editAlarmContact.errCode === 0){
                notification.success({
                    message: '修改成功'
                });
            } else {
                notification.error({
                    message: '修改失败'
                });
            }
            return {
                ...preState,
                data: {
                    ...data,
                    showEditor: false,
                    editorUser: {}
                },
            };
        },
        deleteData(preState, { payload }) {
            const { data } = preState;
            if(payload.deleteAlarmContact.errCode === 0){
                notification.success({
                    message: '删除成功'
                });
            } else {
                notification.error({
                    message: '删除失败'
                });
            }
            return {
                ...preState,
                data: {
                    ...data,
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
        addEditorUser(preState, { payload }) {
            const { data } = preState;
            return {
                ...preState,
                data: {
                    ...data,
                    editorUser: payload.user
                },
            };
        },
    },
    subscriptions: {
        setup({history, dispatch}) {
            return history.listen(({pathname, state}) => {
                if (pathname === '/alarmContact' && state) {
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
