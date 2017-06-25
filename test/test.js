'use strict';

const buble = require('buble');
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

test('create custom fn', t => {
	const importCustom = importJsx.create({pragma: 'x'});

	t.notThrows(() => {
		importCustom(fixturePath('custom'));
	});
});

test.serial('cache', t => {
	spy(buble, 'transform');

	importJsx(fixturePath('react'));
	t.true(buble.transform.calledOnce);

	importJsx(fixturePath('react'));
	t.true(buble.transform.calledOnce);
});
