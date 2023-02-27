import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import test from 'ava';
import findCacheDir from 'find-cache-dir';
import makeDir from 'make-dir';
import {deleteAsync} from 'del';
import {execa} from 'execa';
import packageConfig from '../package.json' assert {type: 'json'};

const cacheDirectory = findCacheDir({name: 'import-jsx'});

const createCacheKey = (source, version) => {
	const contents = JSON.stringify({source, version});
	return crypto.createHash('md5').update(contents).digest('hex') + '.js';
};

const isCached = filename => {
	const source = fs.readFileSync(filename, 'utf8');
	const cacheKey = createCacheKey(source, packageConfig.version);
	return fs.existsSync(path.join(cacheDirectory, cacheKey));
};

const importJsx = async (fixturePath, env) => {
	const {stdout} = await execa('node', ['--loader=./index.js', fixturePath], {
		env: {
			NODE_NO_WARNINGS: '1',
			...env
		}
	});

	return stdout.trim();
};

const clearCache = () => {
	return deleteAsync(cacheDirectory);
};

test.beforeEach(clearCache);

test('automatic runtime - react', async t => {
	const output = await importJsx('test/fixtures/automatic-react.js');
	t.is(output, '<h1>Hello world</h1>');
});

test('automatic runtime - preact', async t => {
	const output = await importJsx('test/fixtures/automatic-preact.js');
	t.is(output, '<h1>Hello world</h1>');
});

test('classic runtime - react', async t => {
	const output = await importJsx('test/fixtures/classic-react.js');
	t.is(output, '<h1>Hello world</h1>');
});

test('classic runtime - preact', async t => {
	const output = await importJsx('test/fixtures/classic-preact.js');
	t.is(output, '<h1>Hello world</h1>');
});

test('transform then cache', async t => {
	await importJsx('test/fixtures/automatic-react.js');
	t.true(isCached('test/fixtures/automatic-react.js'));
});

test('use disk cache', async t => {
	const source = fs.readFileSync('test/fixtures/disk-cache.js', 'utf8');
	const cacheKey = createCacheKey(source, packageConfig.version);

	await makeDir(cacheDirectory);

	fs.writeFileSync(
		path.join(cacheDirectory, cacheKey),
		source.replace('not ', '')
	);

	const output = await importJsx('test/fixtures/disk-cache.js');
	t.is(output, 'This is from disk');
});

test('disable cache', async t => {
	await importJsx('test/fixtures/automatic-react.js', {
		IMPORT_JSX_CACHE: '0'
	});

	t.false(isCached('test/fixtures/automatic-react.js'));

	await importJsx('test/fixtures/automatic-react.js', {
		IMPORT_JSX_CACHE: 'false'
	});

	t.false(isCached('test/fixtures/automatic-react.js'));
});

test('avoid using disk cache when cache is disabled', async t => {
	const source = fs.readFileSync('test/fixtures/disk-cache.js', 'utf8');
	const cacheKey = createCacheKey(source, packageConfig.version);

	await makeDir(cacheDirectory);

	fs.writeFileSync(
		path.join(cacheDirectory, cacheKey),
		source.replace('not ', '')
	);

	const output = await importJsx('test/fixtures/disk-cache.js', {
		IMPORT_JSX_CACHE: 'false'
	});

	t.is(output, 'This is not from disk');
});

test('syntax errors', async t => {
	const error = await t.throwsAsync(async () => {
		await importJsx('test/fixtures/syntax-error.js');
	});

	t.true(error.stderr.includes('SyntaxError: Unexpected identifier'));
});
