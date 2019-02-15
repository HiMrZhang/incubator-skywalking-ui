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
import {Form, Button, Card, Popconfirm, Row, Col, Pagination, Table, Input, Modal} from 'antd';
import styles from './AlarmContact.less';

const FormItem = Form.Item;
const initPaging = {
    pageNum: 1,
    pageSize: 20,
    needTotal: true,
};

@connect(state => ({
    alarmContact: state.alarmContact,
    loading: state.loading.models.alarmContact,
}))
@Form.create({})
export default class AlarmContact extends PureComponent {
    state = {
        isUpdate: false,
    }

    componentWillMount() {
    }

    componentDidMount(){
        this.handleSearch();
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
                        <FormItem label={'姓名'} {...formItemLayout}>
                            {getFieldDecorator('keyword')(
                                <Input maxLength="15" placeholder="请输入姓名"/>
                            )}
                        </FormItem>
                    </Col>
                    <Col span={7} style={{textAlign: 'left'}}>
                        <FormItem>
                            <Button type="primary" htmlType="submit">搜索</Button>
                        </FormItem>
                    </Col>
                    <Col span={10} style={{textAlign: 'right'}}>
                        <FormItem>
                            <Button type="primary" onClick={()=>this.editorAlarm(0)}>添加报警人员</Button>
                        </FormItem>
                    </Col>
                </Row>
            </Form>
        );
    }

    editorAlarm = (type, user) => {
        this.setState({isUpdate: type === 0 ? false : true});
        this.props.dispatch({
            type: 'alarmContact/showEditor',
        });
        this.props.dispatch({
            type: 'alarmContact/addEditorUser',
            payload: {
                user
            },
        });
    };

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
        const {dispatch, alarmContact: {variables: {values}}} = this.props;
        const condition = {
            ...values,
            paging: {
                pageNum: pagination.current,
                pageSize: pagination.pageSize,
                needTotal: true,
            },
        };
        dispatch({
            type: 'alarmContact/saveVariables',
            payload: {
                values: {
                    ...condition,
                },
            },
        });
        delete condition.duration;
        delete condition.applicationId;
        this.fetchData({...condition, queryDuration: values.duration.input}, condition.paging);
    }

    renderTable = (data) => {
        const {alarmContact: {variables: {values}}} = this.props;
        const {paging} = values;
        const columns = [{
            key: '1',
            title: "#",
            render: (text, record, index) => (index + 1) + ((paging.pageNum - 1) * paging.pageSize),
        }, {
            key: 'realName',
            dataIndex: 'realName',
            title: "姓名"
        }, {
            key: 'phoneNumber',
            dataIndex: 'phoneNumber',
            title: "手机号码"
        }, {
            key: 'email',
            dataIndex: 'email',
            title: "邮箱"
        }, {
            key: 'operation',
            title: "操作",
            render: (text, record) => (
                <span>
                  <a onClick={()=> this.editorAlarm(1, record)}>编辑</a>
                  <span className="ant-divider" />
                <Popconfirm title="确认删除吗?" okText="确定" cancelText="取消" onConfirm={()=>this.deleteAlarm(record.id)}>
                    <a>删除</a>
                </Popconfirm>

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

    deleteAlarm = (alarmId) => {
        this.props.dispatch({
            type: 'alarmContact/fetchDeleteAlarm',
            payload: {
                alarmContactId: alarmId
            }
        });
        setTimeout(()=>{
            this.handleSearch();
        }, 1000)
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
                type: 'alarmContact/saveVariables',
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
            type: 'alarmContact/fetchData',
            payload: {
                variables: {
                    keyword: queryCondition.keyword,
                    paging: {
                        ...paging
                    },
                },
            },
        });
    }

    handleCancel = () => {
        this.props.dispatch({
            type: 'alarmContact/hideEditor',
        });
    };

    handleOk = () => {
        const {form, dispatch, alarmContact: {data: {editorUser}}} = this.props;
        const {isUpdate} = this.state;
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            const condition = {...fieldsValue};
            if(isUpdate) {
                dispatch({
                    type: 'alarmContact/fetchEditAlarm',
                    payload: {
                        id: editorUser.id,
                        realName: condition.realName,
                        email: condition.email,
                        phoneNumber: condition.phoneNumber
                    },
                });
            }else {
                dispatch({
                    type: 'alarmContact/fetchAddAlarm',
                    payload: {
                        realName: condition.realName,
                        email: condition.email,
                        phoneNumber: condition.phoneNumber
                    },
                });
            }
        });
        setTimeout(()=>{
            this.handleSearch();
        }, 1000)
    };

    render() {
        const {isUpdate} = this.state;
        const {...propsData} = this.props;
        const {getFieldDecorator} = propsData.form;
        const {alarmContact: {variables: {values}, data: {loadAlarmContactList, showEditor, editorUser}}} = this.props;
        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 5},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 17},
            },
        };
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
                        {this.renderTable(loadAlarmContactList.items)}
                        {this.renderPage(values, loadAlarmContactList.total)}
                    </div>
                </Card>
                {showEditor ?
                <Modal
                    title="添加报警联系人"
                    visible={showEditor}
                    width='50%'
                    onCancel={this.handleCancel}
                    onOk={this.handleOk}
                >
                    <Form layout="horizontal">
                        <FormItem label={'姓名'} {...formItemLayout}>
                            {getFieldDecorator('realName', {
                                rules: [{required: true, message: '请填写姓名'}],
                                initialValue: isUpdate ? editorUser.realName : undefined
                            })(
                                <Input maxLength="15" placeholder="请输入姓名"/>
                            )}
                        </FormItem>
                        <FormItem label={'手机号'} {...formItemLayout}>
                            {getFieldDecorator('phoneNumber', {
                                rules: [{required: true, message: '请填写手机号'}],
                                initialValue: isUpdate ? editorUser.phoneNumber : undefined
                            })(
                                <Input maxLength="15" placeholder="请输入手机号"/>
                            )}
                        </FormItem>
                        <FormItem label={'邮箱'} {...formItemLayout}>
                            {getFieldDecorator('email', {
                                rules: [{required: true, message: '请填写邮箱'}],
                                initialValue: isUpdate ? editorUser.email : undefined
                            })(
                                <Input maxLength="50" placeholder="请输入邮箱"/>
                            )}
                        </FormItem>
                    </Form>
                </Modal> : null
                }
            </div>
        );
    }
}
