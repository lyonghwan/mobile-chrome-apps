/**
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements.  See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership.  The ASF licenses this file
  to you under the Apache License, Version 2.0 (the
  "License"); you may not use this file except in compliance
  with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, either express or implied.  See the License for the
  specific language governing permissions and limitations
  under the License.
 */

'use strict';

// configXmlDom: parsed with DOMParser.
module.exports = exports = function updateConfigXml(manifest, analyzedManifest, configXmlDom) {
  var widget = configXmlDom.lastChild; // firstChild is the <xml> delcaration.
  function $(name) {
    var ret = widget.getElementsByTagName(name);
    return ret && ret[0];
  }
  function getOrCreateRootNode(name) {
    var ret = $(name);
    if (!ret) {
      ret = configXmlDom.createElement(name);
      widget.appendChild(ret);
    }
    return ret;
  }
  function setOrDeleteAttribute(node, name, value) {
    if (value) {
      node.setAttribute(name, value);
    } else {
      node.removeAttribute(name);
    }
  }

  // Find a <preference name="name" value=...> tag
  // If multiple exist, return the last one, if none - undefined.
  function getPreference(name) {
    var prefs = widget.getElementsByTagName('preference');
    var pref;
    for (var i = 0; i < prefs.length; i++) {
      if (prefs[i].getAttribute('name') == name) {
        pref = prefs[i];
      }
    }
    return pref;
  }

  function setOrCreatePreference(name, value) {
    var pref = getPreference(name);
    if (!pref) {
      pref = configXmlDom.createElement('preference');
      pref.setAttribute('name', name);
      widget.appendChild(pref);
    }
    pref.setAttribute('value', value);
    return pref;
  }

  var ver = manifest.version || '0.0.1';
  if (!/^\d+(\.\d+){0,3}$/.test(ver)) {
    throw new Error('Invalid version: "' + ver + '" Must contain at most 4 numbers separated by periods.');
  }

  widget.setAttribute('id', manifest.packageId || 'com.your.company.HelloWorld');
  if (manifest.android && manifest.android.packageId) {
    widget.setAttribute('android-packageName', manifest.android.packageId);
  }
  if (manifest.ios && manifest.ios.packageId) {
    widget.setAttribute('ios-CFBundleIdentifier', manifest.ios.packageId);
  }

  widget.setAttribute('version', ver);
  var androidVersionCode = manifest.versionCode || (manifest.android && manifest.android.versionCode);
  if (!androidVersionCode && manifest.android && manifest.android.version) {
    androidVersionCode = default_versionCode(manifest.android.version);
  }
  setOrDeleteAttribute(widget, 'android-versionCode', androidVersionCode);

  var iosBundleVersion = manifest.CFBundleVersion || (manifest.ios && manifest.ios.CFBundleVersion);
  if (!iosBundleVersion && manifest.ios && manifest.ios.version) {
    iosBundleVersion = default_CFBundleVersion(manifest.ios.version);
  }
  setOrDeleteAttribute(widget, 'ios-CFBundleVersion', iosBundleVersion);

  getOrCreateRootNode('name').textContent = manifest.name || manifest.packageId || 'Your App Name';
  getOrCreateRootNode('description').textContent = manifest.description || 'Plain text description of this app';
  getOrCreateRootNode('author').textContent = manifest.author || 'Author Name <a@b.com>';
  getOrCreateRootNode('content').setAttribute('src', 'plugins/org.chromium.bootstrap/chromeapp.html');

  // Set minSdkVersion and targetSdkVersion, corodva-lib copies them to AndoridManifest.xml
  // Default minSdkVersion is 14 for Android 4.0 (ICS)
  var minSdkVersion = manifest.minSdkVersion || '14';
  setOrCreatePreference('android-minSdkVersion', minSdkVersion);
  if (manifest.targetSdkVersion) {
    setOrCreatePreference('android-targetSdkVersion', manifest.targetSdkVersion);
  }

  var access;
  while ((access = $('access'))) {
    access.parentNode.removeChild(access);
  }
  analyzedManifest.whitelist.forEach(function(pattern, index) {
    var tag = configXmlDom.createElement('access');
    tag.setAttribute('origin', pattern);
    widget.appendChild(tag);
  });
};

// Taken from cordova-lib/src/cordova/metadata/android_parser.js
function default_versionCode(version) {
    var nums = version.split('-')[0].split('.');
    var versionCode = 0;
    if (+nums[0]) {
        versionCode += +nums[0] * 10000;
    }
    if (+nums[1]) {
        versionCode += +nums[1] * 100;
    }
    if (+nums[2]) {
        versionCode += +nums[2];
    }
    return versionCode;
}

// Taken from cordova-lib/src/cordova/metadata/ios_parser.js
function default_CFBundleVersion(version) {
    return version.split('-')[0];
}
