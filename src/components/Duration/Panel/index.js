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


import React, { PureComponent } from 'react';
import { Button, Row, Col, Divider, Form, DatePicker, Select } from 'antd';
import moment from 'moment';
import styles from './index.less';

const { Option } = Select;
const FormItem = Form.Item;
const { RangePicker } = DatePicker;

@Form.create({
  mapPropsToFields(props) {
    if (!props.selected) return {};
    const result = {
      step: Form.createFormField({
        value: props.selected.step,
      }),
    };
    if (props.selected.label) {
      return result;
    }
    result['range-time-picker'] = Form.createFormField({
      value: [props.selected.from(), props.selected.to()],
    });
    return result;
  },
})
class DurationPanel extends PureComponent {
  constructor(props) {
    super(props);

    const now = {
      to() {
        return moment();
      },
    };
    this.shortcuts = [
      { ...now,
        from() {
          return moment().subtract(15, 'minutes');
        },
        label: '过去15分',
      },
      { ...now,
        from() {
          return moment().subtract(30, 'minutes');
        },
        label: '过去30分',
      },
      { ...now,
        from() {
          return moment().subtract(1, 'hours');
        },
        label: '过去1小时',
      },
      { ...now,
        from() {
          return moment().subtract(6, 'hours');
        },
        label: '过去6小时',
      },
      { ...now,
        from() {
          return moment().subtract(12, 'hours');
        },
        label: '过去12小时',
      },
      { ...now,
        from() {
          return moment().subtract(24, 'hours');
        },
        label: '过去24小时',
      },
    ];
    this.shortcutsDays = [
      { ...now,
        from() {
          return moment().subtract(2, 'days');
        },
        label: '过去2天',
      },
      { ...now,
        from() {
          return moment().subtract(7, 'days');
        },
        label: '过去7天',
      },
      { ...now,
        from() {
          return moment().subtract(14, 'days');
        },
        label: '过去14天',
      },
      { ...now,
        from() {
          return moment().subtract(30, 'days');
        },
        label: '过去30天',
      },
      { ...now,
        from() {
          return moment().subtract(6, 'months');
        },
        label: '过去6月',
      },
      { ...now,
        from() {
          return moment().subtract(12, 'months');
        },
        label: '过去12月',
      },
    ];
  }
  componentDidMount() {
    const { onSelected } = this.props;
      const label = localStorage.getItem('selectedLabel');
      const timesstep = localStorage.getItem('timesstep') ? JSON.parse(localStorage.getItem('timesstep')) : undefined;
      if(label){
          let labelIndex = 0, labelType = 'shortcuts';
          this.shortcuts.map((item,k)=>{
              if(item.label.replace(/"/g, '') == label.replace(/"/g, '')){
                  labelIndex = k;
              }
          });
          this.shortcutsDays.map((item,k)=>{
              if(item.label.replace(/"/g, '') == label.replace(/"/g, '')){
                  labelIndex = k;
                  labelType = 'shortcutsDays';
              }
          });
          if(label){
              if(labelType === 'shortcuts'){
                  onSelected(this.shortcuts[labelIndex]);
              } else {
                  onSelected(this.shortcutsDays[labelIndex]);
              }
          } else {
              onSelected(this.shortcuts[0]);
          }
      }
      if(timesstep){
          const selectedTime = {};
          const dateFormat = 'YYYY/MM/DD';
          if(timesstep){
              selectedTime.from = () => moment(timesstep.beginTime, dateFormat);
              selectedTime.to = () => moment(timesstep.endTime, dateFormat);
              selectedTime.step = timesstep.step;
              this.select({...selectedTime});
          }
      }
  }
  disabledDate = (current) => {
    return current && current.valueOf() >= Date.now();
  }
  handleSubmit = (e) => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const selectedTime = {};
        let beginTime = '', endTime = '', step = '';
        for (const key of Object.keys(fieldsValue)) {
        if (fieldsValue[key]) {
          if (key === 'range-time-picker') {
            beginTime =fieldsValue[key][0].format('YYYY/MM/DD');
            endTime =fieldsValue[key][1].format('YYYY/MM/DD');
            selectedTime.from = () => fieldsValue[key][0];
            selectedTime.to = () => fieldsValue[key][1];
          } else {
            step = fieldsValue[key];
            selectedTime[key] = fieldsValue[key];
          }
        }
      }
      const timesstep = {beginTime, endTime, step};
      localStorage.setItem('timesstep', JSON.stringify(timesstep));
      if (selectedTime.from && selectedTime.to) {
        this.select({ ...selectedTime, label: null });
      } else {
        this.select(selectedTime);
      }
    });
  }
  select = (newSelectedTime, type=0) => {
    const { onSelected, selected } = this.props;
    onSelected({ ...selected, ...newSelectedTime });
    if(type ===2){
        localStorage.setItem('timesstep', null);
    }
  }
  render() {
    const { collapsed, form } = this.props;
    if (collapsed) {
      return null;
    }
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };
    const timesstep = JSON.parse(localStorage.getItem('timesstep'));
    const dateFormat = 'YYYY/MM/DD';
    const { getFieldDecorator } = form;
    const content = (
      <Row type="flex" justify="start">
        <Col xs={24} sm={24} md={24} lg={15} xl={10}>
          <Form
            onSubmit={this.handleSubmit}
            hideRequiredMark
          >
            <FormItem
              {...formItemLayout}
              label="时间范围"
            >
              {getFieldDecorator('range-time-picker',{
                  initialValue: timesstep ? [moment(timesstep.beginTime, dateFormat), moment(timesstep.endTime, dateFormat)] : undefined
              })(
                <RangePicker showTime disabledDate={this.disabledDate} format="YYYY-MM-DD HH:mm" />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="重新加载"
            >
              {getFieldDecorator('step')(
                <Select style={{ width: 170 }}>
                  <Option value="0">关闭</Option>
                  <Option value="5000">5s</Option>
                  <Option value="10000">10s</Option>
                  <Option value="30000">30s</Option>
                </Select>
              )}
            </FormItem>
            <FormItem
              wrapperCol={{ offset: 7 }}
            >
              <Button
                type="primary"
                htmlType="submit"
              >
                应用
              </Button>
            </FormItem>
          </Form>
        </Col>
        <Col xs={0} sm={0} md={0} lg={0} xl={1}><Divider type="vertical" style={{ height: 200 }} /></Col>
        <Col xs={24} sm={24} md={4} lg={4} xl={4}>
          <ul className={styles.list}>
            {this.shortcutsDays.map(d => (
              <li key={d.label}>
                <a onClick={this.select.bind(this, d, 2)}>
                  {d.label}
                </a>
              </li>))
            }
          </ul>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4} xl={4}>
          <ul className={styles.list}>
            {this.shortcuts.map(d => (
              <li key={d.label}>
                <a onClick={this.select.bind(this, d, 2)}>
                  {d.label}
                </a>
              </li>))
            }
          </ul>
        </Col>
      </Row>
    );
    return (
      <div className={styles.pageHeader}>
        <div className={styles.detail}>
          <div className={styles.main}>
            <div className={styles.row}>
              <div className={styles.content}>
                {content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default DurationPanel;
