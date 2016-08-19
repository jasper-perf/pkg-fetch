/* eslint-disable camelcase */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import test from 'ava';

if (process.platform !== 'linux' ||
    process.arch !== 'x64') {
  throw new Error('Run the test only on linux-x64');
}

function relative (p) {
  const p2 = path.relative(__dirname, p);
  return p2.replace(/\\/g, '/');
}

const actions = [];
let lastLocal;
const assets = [];

require('../package.json').version = '1337.0.1';

require('../lib/temp-path.js').tempPath = function () {
  return path.join(__dirname, '../temp');
};

require('../lib/spawn.js').spawn = function (cmd, args, opts) {
  assert(opts);
  assert(opts.cwd);
  if (cmd === 'git' && args[0] === 'clone') {
    fs.mkdirSync(path.join(opts.cwd, 'node'));
  }
  if (cmd === 'make') {
    fs.mkdirSync(path.join(opts.cwd, 'out'));
    fs.mkdirSync(path.join(opts.cwd, 'out', 'Release'));
    fs.writeFileSync(path.join(opts.cwd, 'out', 'Release', 'node'), 'ELF');
  }
  if (cmd === 'cmd') {
    fs.mkdirSync(path.join(opts.cwd, 'Release'));
    fs.writeFileSync(path.join(opts.cwd, 'Release', 'node.exe'), 'MZ');
  }
  if (cmd === 'patch') {
    args[args.length - 1] = relative(args[args.length - 1]);
  }
  if (opts.cwd) {
    opts.cwd = relative(opts.cwd);
  }
  actions.push([ cmd, args.join(' '), JSON.stringify(opts) ].join(' '));
};

require('../lib/spawn.js').progress = function () {
};

require('../lib/copy-file.js').copyFile = function (src, dest) {
  src = relative(src);
  actions.push([ 'copyFile', src ].join(' ')); // dest is flaky
  lastLocal = dest;
};

require('../lib/github.js').getRelease = function (tag) {
  actions.push([ 'getRelease', tag ].join(' '));
  return null;
};

require('../lib/github.js').createRelease = function (tag) {
  actions.push([ 'createRelease', tag ].join(' '));
  return { upload_url: 'https://example.com/assets{?name,label}', assets };
};

require('../lib/github.js').uploadAsset = function (local, release, name) {
  assert(local === lastLocal); // test it here. too flaky to push to actions
  actions.push([ 'uploadAsset', JSON.stringify(release), name ].join(' '));
  assets.push({ name });
};

test(async () => {
  const { main } = require('../lib/upload.js');
  await main();
  const mustBe = [
    'git clone --bare --progress https://github.com/nodejs/node node/.git {"cwd":"../temp"}',
    'git --work-tree . reset --hard v0.12.15 {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R00000.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24002.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24204.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24262.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24266.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24523.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24543.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24639.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24642.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24643.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24644.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24824.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R25039.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R25444.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/node.v0.12.15.patch {"cwd":"../temp/node"}',
    './configure --dest-cpu x64 {"cwd":"../temp/node"}',
    'make  {"cwd":"../temp/node"}',
    'copyFile ../temp/node/out/Release/node',
    'getRelease v1337.0.1',
    'createRelease v1337.0.1',
    'uploadAsset {"upload_url":"https://example.com/assets{?name,label}","assets":[]} base-v0.12.15-linux-x64',
    'git clone --bare --progress https://github.com/nodejs/node node/.git {"cwd":"../temp"}',
    'git --work-tree . reset --hard v0.12.15 {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R00000.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24002.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24204.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24262.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24266.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24523.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24543.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24639.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24642.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24643.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24644.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R24824.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R25039.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R25444.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/node.v0.12.15.patch {"cwd":"../temp/node"}',
    './configure --dest-cpu ia32 {"cwd":"../temp/node"}',
    'make  {"cwd":"../temp/node"}',
    'copyFile ../temp/node/out/Release/node',
    'getRelease v1337.0.1',
    'createRelease v1337.0.1',
    'uploadAsset {"upload_url":"https://example.com/assets{?name,label}","assets":[{"name":"base-v0.12.15-linux-x64"}]} base-v0.12.15-linux-x86',
    'git clone --bare --progress https://github.com/nodejs/node node/.git {"cwd":"../temp"}',
    'git --work-tree . reset --hard v4.4.7 {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R32768.v8=4.5.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/node.v4.4.7.patch {"cwd":"../temp/node"}',
    './configure --dest-cpu x64 {"cwd":"../temp/node"}',
    'make  {"cwd":"../temp/node"}',
    'copyFile ../temp/node/out/Release/node',
    'getRelease v1337.0.1',
    'createRelease v1337.0.1',
    'uploadAsset {"upload_url":"https://example.com/assets{?name,label}","assets":[{"name":"base-v0.12.15-linux-x64"},{"name":"base-v0.12.15-linux-x86"}]} base-v4.4.7-linux-x64',
    'git clone --bare --progress https://github.com/nodejs/node node/.git {"cwd":"../temp"}',
    'git --work-tree . reset --hard v4.4.7 {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/backport.R32768.v8=4.5.patch {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/node.v4.4.7.patch {"cwd":"../temp/node"}',
    './configure --dest-cpu ia32 {"cwd":"../temp/node"}',
    'make  {"cwd":"../temp/node"}',
    'copyFile ../temp/node/out/Release/node',
    'getRelease v1337.0.1',
    'createRelease v1337.0.1',
    'uploadAsset {"upload_url":"https://example.com/assets{?name,label}","assets":[{"name":"base-v0.12.15-linux-x64"},{"name":"base-v0.12.15-linux-x86"},{"name":"base-v4.4.7-linux-x64"}]} base-v4.4.7-linux-x86',
    'git clone --bare --progress https://github.com/nodejs/node node/.git {"cwd":"../temp"}',
    'git --work-tree . reset --hard v6.3.1 {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/node.v6.3.1.patch {"cwd":"../temp/node"}',
    './configure --dest-cpu x64 {"cwd":"../temp/node"}',
    'make  {"cwd":"../temp/node"}',
    'copyFile ../temp/node/out/Release/node',
    'getRelease v1337.0.1',
    'createRelease v1337.0.1',
    'uploadAsset {"upload_url":"https://example.com/assets{?name,label}","assets":[{"name":"base-v0.12.15-linux-x64"},{"name":"base-v0.12.15-linux-x86"},{"name":"base-v4.4.7-linux-x64"},{"name":"base-v4.4.7-linux-x86"}]} base-v6.3.1-linux-x64',
    'git clone --bare --progress https://github.com/nodejs/node node/.git {"cwd":"../temp"}',
    'git --work-tree . reset --hard v6.3.1 {"cwd":"../temp/node"}',
    'patch -p1 -i ../patches/node.v6.3.1.patch {"cwd":"../temp/node"}',
    './configure --dest-cpu ia32 {"cwd":"../temp/node"}',
    'make  {"cwd":"../temp/node"}',
    'copyFile ../temp/node/out/Release/node',
    'getRelease v1337.0.1',
    'createRelease v1337.0.1',
    'uploadAsset {"upload_url":"https://example.com/assets{?name,label}","assets":[{"name":"base-v0.12.15-linux-x64"},{"name":"base-v0.12.15-linux-x86"},{"name":"base-v4.4.7-linux-x64"},{"name":"base-v4.4.7-linux-x86"},{"name":"base-v6.3.1-linux-x64"}]} base-v6.3.1-linux-x86'
  ];
  assert.equal(actions.length, mustBe.length);
  for (let i = 0; i < actions.length; i += 1) {
    assert.equal(actions[i], mustBe[i]);
  }
});
