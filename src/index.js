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


import '@babel/polyfill';
import 'url-polyfill';
import dva from 'dva';

import createHistory from 'history/createHashHistory';
// user BrowserHistory
// import createHistory from 'history/createBrowserHistory';
import createLoading from 'dva-loading';
import 'moment/locale/zh-cn';

import 'ant-design-pro/dist/ant-design-pro.css';
import {setCurrentLoginUser, setAuthority} from './utils/authority';

import './index.less';

// 1. Initialize
const app = dva({
  history: createHistory(),
});

// 2. Plugins
app.use(createLoading());

// 3. Register global model
app.model(require('./models/global').default);

// 4. Router
app.router(require('./router').default);


if (window.addEventListener) {
  const n = new Promise((resolve, reject) => {
    window.addEventListener('message', (e) => {
      if (e.source != window.parent) return;
      const {data} = e;
      if (data && typeof data == 'string') {
        window.specialOrigin = e.origin;
        let dataObj = JSON.parse(data);
        if (dataObj && dataObj.authToken) {
          setAuthority(dataObj.name);
          setCurrentLoginUser(dataObj);
          app.start('#root');
        }
      }
    });
  })
} else {
  app.start('#root');
}
// 5. Start



export default app._store;  // eslint-disable-line
