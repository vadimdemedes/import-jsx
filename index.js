'use strict';

const path = require('path');
const fs = require('fs');
const requireFromString = require('require-from-string');
const destructuringTransform = require('babel-plugin-transform-es2015-destructuring');
const restSpreadTransform = require('babel-plugin-transform-object-rest-spread');
const jsxTransform = require('babel-plugin-transform-react-jsx');
const resolveFrom = require('resolve-from');
const callerPath = require('caller-path');
const babel = require('babel-core');

const supportsDestructuring = Number(process.versions.node.split('.')[0]) >= 6;

const cache = new Map();

const importJsx = (moduleId, options) => {
	if (typeof moduleId !== 'string') {
		throw new TypeError('Expected a string');
	}

	options = Object.assign({
		pragma: 'h',
		cache: true
	}, options);

	const modulePath = resolveFrom(path.dirname(callerPath()), moduleId);

	if (options.cache && cache.has(modulePath)) {
		return cache.get(modulePath);
	}

	const source = fs.readFileSync(modulePath, 'utf8');

	if (source.includes('React')) {
		options.pragma = 'React.createElement';
	}

	const plugins = [
		[restSpreadTransform, {useBuiltIns: true}],
		supportsDestructuring ? null : destructuringTransform,
		[jsxTransform, {pragma: options.pragma, useBuiltIns: true}]
	].filter(Boolean);

	const result = babel.transform(source, {
		plugins,
		filename: modulePath,
		sourceMaps: 'inline'
	});

	const m = requireFromString(result.code, modulePath);

	if (options.cache) {
		cache.set(modulePath, m);
	}

	return m;
};

module.exports = importJsx;

module.exports.create = options => {
	return moduleId => importJsx(moduleId, options);
};
