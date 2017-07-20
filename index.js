'use strict';

const path = require('path');
const fs = require('fs');
const requireFromString = require('require-from-string');
const jsxTransform = require('babel-plugin-transform-react-jsx');
const resolveFrom = require('resolve-from');
const callerPath = require('caller-path');
const babel = require('babel-core');

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

	const result = babel.transform(source, {
		plugins: [
			[jsxTransform, {pragma: options.pragma, useBuiltIns: true}]
		],
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
