import React, {PureComponent} from 'react';
import {connect} from 'dva';
import {Form, Select, Button, Card, InputNumber, Row, Col, Pagination, DatePicker, Table} from 'antd';
import {generateDuration} from '../../utils/time';
import styles from './ServiceReferenceMetric.less';

const {Option} = Select;
const {RangePicker} = DatePicker;
const FormItem = Form.Item;
const initPaging = {
    pageNum: 1,
    pageSize: 20,
    needTotal: true,
};

@connect(state => ({
    serviceReferenceMetric: state.serviceReferenceMetric,
    loading: state.loading.models.serviceReferenceMetric,
}))
@Form.create({
    mapPropsToFields(props) {
        const {variables: {values}} = props.serviceReferenceMetric;
        const result = {};
        Object.keys(values).filter(_ => _ !== 'range-time-picker').forEach((_) => {
            result[_] = Form.createFormField({
                value: values[_],
            });
        });
        const {duration} = values;
        if (duration) {
            result['range-time-picker'] = Form.createFormField({
                value: [duration.raw.start, duration.raw.end],
            });
        }
        return result;
    },
})
export default class ServiceReferenceMetric extends PureComponent {
    state = {
        thisBehindOption: '0',
        thisFrontOption: '0'
    }

    componentWillMount() {
        const {...propsData} = this.props;
        const {serviceReferenceMetric: {variables: {values}}} = this.props;
        const {duration} = values;
        propsData.dispatch({
            type: 'serviceReferenceMetric/initOptions',
            payload: {variables: {duration: duration.input}},
        });
    }

    handleBehindChange = (selected) => {
        this.setState({thisBehindOption: selected});
    };

    handleFrontChange = (selected) => {
        this.setState({thisFrontOption: selected});
        this.props.form.setFieldsValue({'behindApplicationId': '0'})
    };

    renderForm() {
        const {...propsData} = this.props;
        const {getFieldDecorator} = propsData.form;
        const formItemLayout = {
            labelCol: {
                xs: {span: 7},
                sm: {span: 7},
            },
            wrapperCol: {
                xs: {span: 15},
                sm: {span: 15},
            },
        };
        const {serviceReferenceMetric: {variables: {options}, data}, loading} = this.props;
        return (
            <Form onSubmit={this.handleSearch} layout="vertical">
                <Row>
                    <Col span={8}>
                        <FormItem label={'Time Range'} {...formItemLayout}>
                            {getFieldDecorator('range-time-picker', {
                                rules: [{
                                    required: true,
                                    message: 'Please select the correct date',
                                }],
                            })(
                                <RangePicker
                                    showTime
                                    disabledDate={current => current && current.valueOf() >= Date.now()}
                                    format="YYYY-MM-DD HH:mm"
                                    style={{ width: '100%' }}
                                />
                            )}
                        </FormItem>
                    </Col>
                    <Col span={8}>
                        <FormItem label="Order By" {...formItemLayout}>
                            {getFieldDecorator('queryOrder')(
                                <Select placeholder="Time Bucket" style={{ width: '100%' }}>
                                    <Option key="BY_TIME_BUCKET" value="BY_TIME_BUCKET">Time Bucket</Option>
                                    <Option key="BY_TRANSACTION_AVERAGE_DURATION" value="BY_TRANSACTION_AVERAGE_DURATION">Transaction average duration</Option>
                                    <Option key="BY_TRANSACTION_CALLS" value="BY_TRANSACTION_CALLS">Transaction Calls</Option>
                                    <Option key="BY_TRANSACTION_ERROR_CALLS" value="BY_TRANSACTION_ERROR_CALLS">Transaction Error Calls</Option>
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                    <Col span={8}>
                        <FormItem label="Front Application" {...formItemLayout}>
                            {getFieldDecorator('frontApplicationId', {
                                initialValue: this.state.thisFrontOption
                            })(
                                <Select placeholder="All" style={{ width: '100%' }}
                                        onChange ={this.handleFrontChange}>
                                    <Option key="0" value="0">All</Option>
                                    {
                                        options.applicationId && options.applicationId.map((service) => {
                                            return (
                                                <Option key={service.key ? service.key : -1} value={service.key} disabled={this.state.thisBehindOption === service.key ? false : false}>
                                                    {service.label}
                                                </Option>);
                                        })
                                    }
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                    <Col span={8}>
                        <FormItem label="Behind Application" {...formItemLayout}>
                            {getFieldDecorator('behindApplicationId', {
                                initialValue: this.state.thisBehindOption
                            })(
                                <Select key="2" placeholder="All" style={{ width: '100%' }}
                                        onChange={this.handleBehindChange.bind(this)}>
                                    <Option key="0" value="0">All</Option>
                                    {
                                        options.applicationId && options.applicationId.map((service) => {
                                            return (
                                                <Option key={service.key ? service.key : -1} value={service.key} disabled={this.state.thisFrontOption === service.key ? true : false}>
                                                    {service.label}
                                                </Option>);
                                        })
                                    }
                                </Select>
                            )}
                        </FormItem>
                    </Col>
                    <Col span={8}>
                        <Row>
                            <Col span={7}>
                                duration range
                            </Col>
                            <Col span={15}>
                                <Row>
                                    <Col span={12}>
                                        <FormItem label="">
                                            {getFieldDecorator('minTransactionAverageDuration')(
                                                <InputNumber style={{width: '90%'}} placeholder="eg 10"/>
                                            )}
                                        </FormItem>
                                    </Col>
                                    <Col span={12} style={{textAlign: 'right'}}>
                                        <FormItem label="">
                                            {getFieldDecorator('maxTransactionAverageDuration')(
                                                <InputNumber style={{width: '90%'}} placeholder="eg 1200"/>
                                            )}
                                        </FormItem>
                                    </Col>
                                </Row>

                            </Col>
                        </Row>
                    </Col>
                    <Col span={7} style={{textAlign: 'right'}}>
                        <FormItem>
                            <Button type="primary" htmlType="submit">Search</Button>
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
        const {dispatch, serviceReferenceMetric: {variables: {values}}} = this.props;
        const condition = {
            ...values,
            paging: {
                pageNum: pagination.current,
                pageSize: pagination.pageSize,
                needTotal: true,
            },
        };
        dispatch({
            type: 'serviceReferenceMetric/saveVariables',
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
        const {serviceReferenceMetric: {variables: {values}}} = this.props;
        const {paging} = values;
        const columns = [{
            key: '1',
            title: "#",
            render: (text, record, index) => (index + 1) + ((paging.pageNum - 1) * paging.pageSize),
        }, {
            key: 'serviceName',
            dataIndex: 'serviceName',
            title: "service name",
            render: (text, record) => (<span>{record.behindServiceInfo.name}</span>)
        }, {
            key: 'frontServiceInfo',
            dataIndex: 'frontServiceInfo',
            title: "front application",
            render: (text, record) => (<span>{record.frontServiceInfo.applicationName}</span>)
        }, {
            key: 'behindServiceInfo',
            dataIndex: 'behindServiceInfo',
            title: "behind application",
            render: (text, record) => (<span>{record.behindServiceInfo.applicationName}</span>)
        }, {
            key: 'calls',
            dataIndex: 'calls',
            title: "calls"
        }, {
            key: 'errorCalls',
            dataIndex: 'errorCalls',
            title: "error calls"
        }, {
            key: 'averageDuration',
            dataIndex: 'averageDuration',
            title: "avg duration"
        }]
        return (
            <Table
                columns={columns}
                dataSource={data}
                rowKey={(record) => record.id}
                pagination={false}
            />
        )
    }

    handleSearch = (e) => {
        if (e) {
            e.preventDefault();
        }
        const {form, dispatch} = this.props;
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            const condition = {...fieldsValue};
            delete condition['range-time-picker'];
            const rangeTime = fieldsValue['range-time-picker'];
            const duration = generateDuration({from: () => rangeTime[0], to: () => rangeTime[1]});
            dispatch({
                type: 'serviceReferenceMetric/saveVariables',
                payload: {
                    values: {
                        ...condition,
                        duration,
                        paging: initPaging
                    },
                },
            });
            this.fetchData({...condition, queryDuration: duration.input});
        });
    }

    fetchData = (queryCondition, paging = initPaging) => {
        const {...propsData} = this.props;
        propsData.dispatch({
            type: 'serviceReferenceMetric/fetchData',
            payload: {
                variables: {
                    condition: {
                        ...queryCondition,
                        paging,
                    },
                },
            },
        });
    }

    render() {
        const {serviceReferenceMetric: {variables: {values}, data: {queryServiceReferenceMetricBrief}}, loading} = this.props;
        return (
            <div>
                <Card bordered={false} style={{marginBottom: 10}} bodyStyle={{paddingBottom: 0}}>
                    <div className={styles.tableList}>
                        <Row>
                            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                                {this.renderForm()}
                            </Col>
                        </Row>
                    </div>
                </Card>
                <Card bordered={false}>
                    <div className={styles.tableList}>
                        {this.renderTable(queryServiceReferenceMetricBrief.serviceReferenceMetrics)}
                        {this.renderPage(values, queryServiceReferenceMetricBrief.total)}
                    </div>
                </Card>
            </div>
        );
    }
}
