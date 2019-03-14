'use strict';

const path = require('path');
const destructuringTransform = require('babel-plugin-transform-es2015-destructuring');
const restSpreadTransform = require('babel-plugin-transform-object-rest-spread');
const jsxTransform = require('babel-plugin-transform-react-jsx');
const resolveFrom = require('resolve-from');
const callerPath = require('caller-path');
const babel = require('babel-core');

const importJsx = (moduleId, options) => {
	if (typeof moduleId !== 'string') {
		throw new TypeError('Expected a string');
	}

	options = Object.assign({
		pragma: 'h',
		cache: true,
		// Put on options object for easier testing.
		supportsDestructuring: Number(process.versions.node.split('.')[0]) >= 6
	}, options);

	const modulePath = resolveFrom(path.dirname(callerPath()), moduleId);

	if (!options.cache) {
		delete require.cache[modulePath];
	}

	// If they used .jsx, and there's already a .jsx, then hook there
	// Otherwise, hook node's default .js
	const ext = path.extname(modulePath);
	const hookExt = require.extensions[ext] ? ext : '.js';

	const oldExtension = require.extensions[hookExt];

	require.extensions[hookExt] = module => {
		const oldCompile = module._compile;

		module._compile = source => {
			if (source.includes('React')) {
				options.pragma = 'React.createElement';
			}

			const plugins = [
				[restSpreadTransform, {useBuiltIns: true}],
				options.supportsDestructuring ? null : destructuringTransform,
				[jsxTransform, {pragma: options.pragma, useBuiltIns: true}]
			].filter(Boolean);

			const result = babel.transform(source, {
				plugins,
				filename: modulePath,
				sourceMaps: 'inline',
				babelrc: false
			});

			module._compile = oldCompile;
			module._compile(result.code, modulePath);
		};

		require.extensions[hookExt] = oldExtension;
		oldExtension(module, modulePath);
	};

	const m = require(modulePath);
	require.extensions[hookExt] = oldExtension;

	if (!options.cache) {
		delete require.cache[modulePath];
	}

	return m;
};

module.exports = importJsx;

module.exports.create = options => {
	return moduleId => importJsx(moduleId, options);
};
