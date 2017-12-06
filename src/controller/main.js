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
  const returnButton = document.getElementById('return-button');
  const transparentizeButton = document.getElementById('transparentize-button');
  const tweetButton = document.getElementById('tweet-button');
  const commandsInput = document.getElementById('commands-input');
  const contentInput = document.getElementById('content-input');
  const tagsInput = document.getElementById('tags-input');
  const tweetForm = document.getElementById('tweet-form');

  const sendTweet = () => {
    if (contentInput.value !== '') {
      const commands = commandsInput.value.length === 0 ? '' : `[${commandsInput.value}]`;
      const tags = tagsInput.value.length === 0 ? '' : (' ' + tagsInput.value.split(' ').map(s => `#${s}`).join(' '));
      const status = commands + contentInput.value + tags;
      ipcRenderer.send('controller:tweet', status);
      contentInput.value = '';
    }
  };

  returnButton.addEventListener('click', () => {
    ipcRenderer.send('controller:return');
  });

  transparentizeButton.addEventListener('click', () => {
    ipcRenderer.send('controller:transparentize');
  });

  tweetButton.addEventListener('click', sendTweet);

  tweetForm.onsubmit = () => {
    sendTweet();
    return false;
  };
};
