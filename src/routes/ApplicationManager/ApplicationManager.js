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
import React, {PureComponent} from 'react';
import {connect} from 'dva';
import {Form, Button, Card, Row, Col, Pagination, Table, Input, Modal, Transfer} from 'antd';
import styles from './ApplicationManager.less';

const FormItem = Form.Item;
const initPaging = {
    pageNum: 1,
    pageSize: 20,
    needTotal: true,
};

@connect(state => ({
    applicationManager: state.applicationManager,
    loading: state.loading.models.applicationManager,
}))
@Form.create({})
export default class ApplicationManager extends PureComponent {
    state = {
        isUpdate: false,
    }

    componentWillMount() {
    }

    alarmColumns = [{
        key: 'realName',
        dataIndex: 'realName',
        title: "联系人"
    }, {
        key: 'phoneNumber',
        dataIndex: 'phoneNumber',
        title: "手机号",
    }, {
        key: 'email',
        dataIndex: 'email',
        title: "邮箱",
    }]

    componentDidMount(){
        this.handleSearch();
        this.props.dispatch({
            type: 'applicationManager/fetchAlarm',
        });
    }

    renderForm() {
        const {...propsData} = this.props;
        const {getFieldDecorator} = propsData.form;
        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 6},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 17},
            },
        };
        return (
            <Form onSubmit={this.handleSearch} layout="vertical">
                <Row>
                    <Col span={7}>
                        <FormItem label={'应用名称'} {...formItemLayout}>
                            {getFieldDecorator('applicationCode')(
                                <Input maxLength="100" placeholder="请输入应用名称"/>
                            )}
                        </FormItem>
                    </Col>
                    <Col span={7} style={{textAlign: 'left'}}>
                        <FormItem>
                            <Button type="primary" htmlType="submit">搜索</Button>
                        </FormItem>
                    </Col>
                </Row>
            </Form>
        );
    }

    renderPage = (values, total) => {
        if (total < 1) {
            return null;
        }
        let currentPageNum = 1;
        let currentPageSize = 20;
        if (values.paging) {
            const {paging: {pageNum, pageSize}} = values;
            currentPageNum = pageNum;
            currentPageSize = pageSize;
        }
        return (
            <Row type="flex" justify="end" style={{marginTop: 15}}>
                <Col>
                    <Pagination
                        size="small"
                        current={currentPageNum}
                        pageSize={currentPageSize}
                        total={total}
                        defaultPageSize={20}
                        showSizeChanger
                        pageSizeOptions={['20', '50', '100', '200']}
                        onChange={(page, pageSize) => {
              this.handleTableChange({ current: page, pageSize });
            }}
                        onShowSizeChange={(current, size) => {
              this.handleTableChange({ current: 1, pageSize: size });
            }}
                    />
                </Col>
            </Row>);
    }

    handleTableChange = (pagination) => {
        const {dispatch, applicationManager: {variables: {values}}} = this.props;
        const condition = {
            ...values,
            paging: {
                pageNum: pagination.current,
                pageSize: pagination.pageSize,
                needTotal: true,
            },
        };
        dispatch({
            type: 'applicationManager/saveVariables',
            payload: {
                values: {
                    ...condition,
                },
            },
        });
        this.fetchData({...condition, queryDuration: values.duration.input}, condition.paging);
    }

    renderTable = (data) => {
        const {applicationManager: {variables: {values}}} = this.props;
        const {paging} = values;
        const columns = [{
            key: '1',
            title: "#",
            render: (text, record, index) => (index + 1) + ((paging.pageNum - 1) * paging.pageSize),
        }, {
            key: 'name',
            dataIndex: 'name',
            title: "应用名称"
        }, {
            key: 'alarmUser',
            title: "通知对象",
            render: (text, record) => (
                <span>报警提醒人员<a onClick={()=>{this.handleAlarmDetail(record)}}>查看</a></span>
            )
        }, {
            key: 'operation',
            title: "操作",
            render: (text, record) => (
                <span>
                  <a onClick={()=>{this.editorAlarm(record)}}>编辑</a>
                </span>
            ),
        }];
        return (
            <Table
                columns={columns}
                dataSource={data}
                style={{marginTop: 15}}
                rowKey={(record) => record.id}
                pagination={false}
            />
        )
    }

    handleAlarmDetail = (application) => {
        this.props.dispatch({
            type: 'applicationManager/showEditor',
        });
        this.props.dispatch({
            type: 'applicationManager/setEditApplication',
            payload: {
                applicationId: ''
            },
        });
        this.props.dispatch({
            type: 'applicationManager/fetchSelectAlarm',
            payload: {
                applicationId: application.id
            },
        });
    }

    editorAlarm = (application) => {
        this.props.dispatch({
            type: 'applicationManager/showEditor',
        });
        this.props.dispatch({
            type: 'applicationManager/setEditApplication',
            payload: {
                applicationId: application.id
            },
        });
        this.props.dispatch({
            type: 'applicationManager/fetchSelectAlarm',
            payload: {
                applicationId: application.id
            },
        });
    };

    handleSearch = (e) => {
        if (e) {
            e.preventDefault();
        }
        const {form, dispatch} = this.props;
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            const condition = {...fieldsValue};
            dispatch({
                type: 'applicationManager/saveVariables',
                payload: {
                    values: {
                        ...condition,
                        paging: initPaging
                    },
                },
            });
            this.fetchData({...condition});
        });
    }

    fetchData = (queryCondition, paging = initPaging) => {
        const {...propsData} = this.props;
        propsData.dispatch({
            type: 'applicationManager/fetchData',
            payload: {
                variables: {
                    applicationCode: queryCondition.applicationCode,
                    paging: {
                        ...paging
                    },
                },
            },
        });
    }

    handleCancel = () => {
        this.props.dispatch({
            type: 'applicationManager/hideEditor',
        });
    };

    handleOk = () => {
        const {form, dispatch, applicationManager: {data: {loadApplicationAlarmContactId, editApplicationId}}} = this.props;
        if(editApplicationId != ''){
            dispatch({
                type: 'applicationManager/fetchEdit',
                payload: {
                    alarmContactIds: loadApplicationAlarmContactId,
                    applicationId: editApplicationId
                },
            });
        } else {
            this.props.dispatch({
                type: 'applicationManager/hideEditor',
            });
        }
    };

    handleChange = (targetKeys) => {
        this.props.dispatch({
            type: 'applicationManager/editorSelectId',
            payload: {
                loadApplicationAlarmContactId: targetKeys
            }
        });
    };

    render() {
        const {applicationManager: {variables: {values}, data: {getApplication, showEditor, loadAllAlarmContact, editApplicationId, loadApplicationAlarmContact, loadApplicationAlarmContactId}}} = this.props;
        return (
            <div>
                <Card bordered={false}>
                    <div className={styles.tableList}>
                        <Row>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                {this.renderForm()}
                            </Col>
                        </Row>
                    </div>
                    <div className={styles.tableList}>
                        {this.renderTable(getApplication.items)}
                        {this.renderPage(values, getApplication.total)}
                    </div>
                </Card>
                {showEditor ?
                <Modal
                    title="应用设置"
                    visible={showEditor}
                    width='50%'
                    onCancel={this.handleCancel}
                    onOk={this.handleOk}
                >
                    <div>
                        {editApplicationId != '' ?
                            <Transfer
                                dataSource={loadAllAlarmContact.map(item=>{item.key=item.id; return item;})}
                                titles={['已有联系人', '已选联系人']}
                                key={item => item.realName}
                                targetKeys={loadApplicationAlarmContactId}
                                render={item => item.realName}
                                listStyle={{width: '45.5%',height: 280,overflow:'auto'}}
                                onChange={this.handleChange}
                            /> :
                            <Table
                                columns={this.alarmColumns}
                                dataSource={loadApplicationAlarmContact}
                                rowKey={(record) => record.id}
                                pagination={false}
                            />
                        }
                    </div>
                </Modal> : null
                }
            </div>
        );
    }
}
