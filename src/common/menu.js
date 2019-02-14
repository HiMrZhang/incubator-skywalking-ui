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


import { isUrl } from '../utils/utils';

const menuData = [{
  name: '监控',
  icon: 'dashboard',
  path: 'monitor',
  children: [
    {
      name: '工作台',
      path: 'dashboard',
    },
    {
      name: '拓扑',
      path: 'topology',
    }, {
      name: '应用',
      path: 'application',
    }, {
      name: '服务',
      path: 'service',
    }, {
      name: '报警',
      path: 'alarm',
    },
  ],
}, {
  name: '跟踪',
  icon: 'exception',
  path: 'trace',
}, {
  name: '服务调用',
  icon: 'disconnect',
  path: 'serviceReferenceMetric',
}, {
  name: '报警联系人',
  icon: 'contacts',
  path: 'alarmContact',
}, {
  name: '应用管理',
  icon: 'api',
  path: 'applicationManager',
}];

function formatter(data, parentPath = '', parentAuthority) {
  return data.map((item) => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority,
    };
    if (item.children) {
      result.children = formatter(item.children, `${parentPath}${item.path}/`, item.authority);
    }
    return result;
  });
}

export const getMenuData = () => formatter(menuData);
