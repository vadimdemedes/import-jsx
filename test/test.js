'use strict';

const babel = require('babel-core');
const {spy} = require('sinon');
const test = require('ava');
const importJsx = require('..');

const fixturePath = name => `${__dirname}/fixtures/${name}`;

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
	spy(babel, 'transform');

	importJsx(fixturePath('react'));
	t.true(babel.transform.calledOnce);

	importJsx(fixturePath('react'));
	t.true(babel.transform.calledOnce);
});

test.serial('disable cache', t => {
	babel.transform.reset();

	importJsx(fixturePath('react'), {cache: false});
	t.true(babel.transform.calledOnce);

	importJsx(fixturePath('react'), {cache: false});
	t.true(babel.transform.calledTwice);
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
