import test from 'ava';
import importJsx from '..';

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
