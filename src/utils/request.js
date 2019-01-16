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


import fetch from 'dva/fetch';
import { notification } from 'antd';
import { routerRedux } from 'dva/router';
import store from '../index';
import {getCurrentLoginUser} from './authority';
import {setAuthority} from './authority';
import {getParentOrigin} from './utils';

const codeMessage = {
  404: 'No resource',
  500: 'Server error',
};
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
      return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  notification.error({
    message: `Request Error ${response.status}: ${response.url}`,
    description: errortext,
  });
  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options) {
  const defaultOptions = {
    credentials: 'include',
  };
  const newOptions = { ...defaultOptions, ...options };
  if (newOptions.method === 'POST' || newOptions.method === 'PUT') {
    newOptions.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      ...newOptions.headers,
      'auth-token': getCurrentLoginUser().authToken,
    };
    newOptions.body = JSON.stringify(newOptions.body);
  }

  return fetch(url, newOptions)
    .then(checkStatus)
    .then((response) => {
      if (newOptions.method === 'DELETE' || response.status === 204) {
        return response.text();
      }
      return response.json();
    })
    .then((json) => {
      const { errors } = json;
      if (errors) {
        errors.forEach((_) => {
          notification.error({
            message: _.message,
          });
        });
      }
      return json;
    })
    .catch((e) => {
      const { dispatch } = store;
      const status = e.name;
      const parentOrigin = getParentOrigin();
      if (status === 403) {
          window.location.href = `${parentOrigin}/error-403.html`;
        return;
      }
      if (status <= 504 && status >= 500) {
          window.location.href = `${parentOrigin}/error-500.html`;
        return;
      }
      if (status >= 404 && status < 422) {
          window.location.href = `${parentOrigin}/error-404.html`;
          return
      }
      if(status === 401){
          setAuthority('');
          window.location.href = `${parentOrigin}/error-401.html`;
      }
    });
}
