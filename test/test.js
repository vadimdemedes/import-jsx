'use strict';
const fs = require('fs');
const crypto = require('crypto');
const test = require('ava');
const findCacheDir = require('find-cache-dir');
const rimraf = require('rimraf');
const importJsx = require('..');
const packageJson = require('../package.json');

const fixturePath = name => `${__dirname}/fixtures/${name}`;
const isCached = path => Object.keys(require.cache).includes(path + '.js');
const diskCacheDirectory = findCacheDir({name: 'import-jsx'});
const clearDiskCache = () => rimraf.sync(diskCacheDirectory);

// Hacky - delete from memory cache, so it will use the disk cache
const deleteFromMemoryCache = name => {
	delete require.cache[`${fixturePath(name)}.js`];
};

test('throw when module id is missing', t => {
	t.throws(() => importJsx(), TypeError, 'Expected a string');
});

test('import react component and auto-detect pragma', t => {
	t.notThrows(() => {
		importJsx(fixturePath('react'));
	});
});

test('import other component and use `h` pragma', t => {
	t.notThrows(() => {
		importJsx(fixturePath('other'));
	});
});

test('import custom component with custom pragma', t => {
	t.notThrows(() => {
		importJsx(fixturePath('custom'), {pragma: 'x'});
	});
});

test('create custom fn', t => {
	const importCustom = importJsx.create({pragma: 'x'});

	t.notThrows(() => {
		importCustom(fixturePath('custom'));
	});
});

test.serial('cache', t => {
	const path = fixturePath('react');

	importJsx(path);
	t.true(isCached(path));
});

test.serial('disable cache', t => {
	const path = fixturePath('react');

	importJsx(fixturePath('react'), {cache: false});
	t.false(isCached(path));
});

test('syntax error includes filename', t => {
	const file = fixturePath('syntax-error.js');
	const error = t.throws(() => importJsx(file));
	t.is(error.message.split(':')[0], file);
});

test('works when loading a module with a non-JS ext', t => {
	const file = fixturePath('jsx-ext.jsx');
	t.true(importJsx(file).exty);
});

test('parse React fragments', t => {
	t.notThrows(() => {
		importJsx(fixturePath('react-fragment'));
	});
});

const contents = JSON.stringify({
	source: fs.readFileSync(fixturePath('for-cache') + '.js', 'utf8'),
	options: {
		pragma: 'h',
		pragmaFrag: 'Fragment',
		cache: true
	},
	version: packageJson.version
});

const hash = crypto.createHash('md4').update(contents).digest('hex');
const diskCacheFile = `${diskCacheDirectory}/${hash}.js`;

test('creates appropriate disk cache file', t => {
	clearDiskCache();
	t.false(fs.existsSync(diskCacheFile));

	importJsx(fixturePath('for-cache'));
	t.true(fs.existsSync(diskCacheFile));
});

test('use disk cache', t => {
	clearDiskCache();

	deleteFromMemoryCache('for-cache');
	const text = importJsx(fixturePath('for-cache'));
	t.is(text, 'For testing the disk cache!');

	const contents = fs.readFileSync(diskCacheFile, 'utf8');
	fs.writeFileSync(
		diskCacheFile,
		contents.replace('For testing', 'For really testing')
	);

	deleteFromMemoryCache('for-cache');
	const text2 = importJsx(fixturePath('for-cache'));
	t.is(text2, 'For really testing the disk cache!');
});

test('avoid use disk cache when cache is disabled', t => {
	clearDiskCache();

	deleteFromMemoryCache('for-cache');
	const text = importJsx(fixturePath('for-cache'));
	t.is(text, 'For testing the disk cache!');

	const contents = fs.readFileSync(diskCacheFile, 'utf8');
	fs.writeFileSync(
		diskCacheFile,
		contents.replace('For testing', 'For really testing')
	);

	deleteFromMemoryCache('for-cache');
	const text2 = importJsx(fixturePath('for-cache'), {cache: false});
	t.is(text2, 'For testing the disk cache!');
});
