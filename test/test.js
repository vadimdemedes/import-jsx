'use strict';

const os = require('os');
const test = require('ava');
const findCacheDir = require('find-cache-dir');
const rimraf = require('rimraf');
const importJsx = require('..');

// Clear cache
const cacheDirectory = findCacheDir({name: 'import-jsx'}) || os.tmpdir();
rimraf.sync(cacheDirectory);

const fixturePath = name => `${__dirname}/fixtures/${name}`;
const isCached = path => Boolean(Object.keys(require.cache).includes(path + '.js'));

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

test('transform object rest spread', t => {
	t.notThrows(() => {
		importJsx(fixturePath('spread'));
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

test('works when destructuring isnt available natively', t => {
	const file = fixturePath('destructure');
	const result = importJsx(file, {supportsDestructuring: false});
	t.is(result.x, 'a');
	t.is(result.y, 'b');
});

test('parse React fragments', t => {
	t.notThrows(() => {
		importJsx(fixturePath('react-fragment'));
	});
});
