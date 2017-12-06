/**
 * Copyright 2017 Double_oxygeN
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const { ipcRenderer } = require('electron');

window.onload = () => {
  const loginStatus = document.getElementById('login-status');
  const loginLogoutButton = document.getElementById('login-logout-button');
  const okButton = document.getElementById('ok-button');
  const resetButton = document.getElementById('reset-button');
  const queryForm = document.getElementById('query-form');
  const frameSizeForm = document.getElementById('frame-size-form');
  const transparencyForm = document.getElementById('transparency-form');
  const shadowForm = document.getElementById('shadow-form');
  const queryWordInput = document.getElementById('query-word');
  const customSizeWidthInput = document.getElementById('custom-size-width');
  const customSizeHeightInput = document.getElementById('custom-size-height');

  let login = false;

  const getAllInputs = htmlFormElement => {
    return Array.from(htmlFormElement.getElementsByTagName('input'));
  };
  const controlInputsDisabled = (htmlFormElement, disabled) => {
    getAllInputs(htmlFormElement).forEach(input => input.disabled = disabled);
  };

  loginLogoutButton.addEventListener('click', () => {
    if (!login) {
      loginStatus.innerHTML = 'Trying login...';
      loginLogoutButton.disabled = true;
      ipcRenderer.send('config:twitter-login');
    } else {
      ipcRenderer.send('config:twitter-logout');
      loginLogoutButton.innerHTML = 'LOGIN';
      login = false;
      controlInputsDisabled(queryForm, true);
      controlInputsDisabled(frameSizeForm, true);
      controlInputsDisabled(transparencyForm, true);
      controlInputsDisabled(shadowForm, true);
      resetButton.disabled = true;
      okButton.disabled = true;
      loginStatus.innerHTML = 'Please login.';
    }
  });

  resetButton.addEventListener('click', () => {
    queryForm.query.value = 'user';
    frameSizeForm.size.value = 'large';
    transparencyForm.transparency.value = '1.0';
  });

  okButton.addEventListener('click', () => {
    const endpoint = queryForm.query.value === 'user' ? 'user' : 'statuses/filter';
    const query = endpoint === 'user' ? {} : { track: queryWordInput.value };
    const size = frameSizeForm.size.value === 'medium' ? { width: 640, height: 360 } :
      frameSizeForm.size.value === 'large' ? { width: 854, height: 480 } : { width: window.parseInt(customSizeWidthInput.value, 10), height: window.parseInt(customSizeHeightInput.value, 10) };
    const alpha = Number(transparencyForm.transparency.value);
    const shadow = shadowForm.shadow.value === 'on';
    ipcRenderer.send('config:start', {
      endpoint,
      query,
      size,
      alpha,
      shadow
    });
  });

  ipcRenderer.on('login:success', (ev, id) => {
    login = true;
    loginStatus.innerHTML = `Login succeeded! @${id}`;
    loginLogoutButton.innerHTML = 'LOGOUT';
    controlInputsDisabled(queryForm, false);
    controlInputsDisabled(frameSizeForm, false);
    controlInputsDisabled(transparencyForm, false);
    controlInputsDisabled(shadowForm, false);
    resetButton.disabled = false;
    okButton.disabled = false;
    loginLogoutButton.disabled = false;
  });

  ipcRenderer.on('login:failure', () => {
    loginStatus.innerHTML = 'Login failed!';
    loginLogoutButton.disabled = false;
    window.setTimeout(() => {
      loginStatus.innerHTML = 'Please login.';
    }, 3000);
  });
};
