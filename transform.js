// Only load these if compiled source is not already cached
let babel;
let destructuringTransform;
let restSpreadTransform;
let jsxTransform;

const transform = (source, options, modulePath) => {
	if (!babel) {
		babel = require('@babel/core');
		destructuringTransform = require('@babel/plugin-transform-destructuring');
		restSpreadTransform = require('@babel/plugin-proposal-object-rest-spread');
		jsxTransform = require('@babel/plugin-transform-react-jsx');
	}
	if (source.includes('React')) {
		options.pragma = 'React.createElement';
		options.pragmaFrag = 'React.Fragment';
	}

	const plugins = [
		[restSpreadTransform, {useBuiltIns: true}],
		options.supportsDestructuring ? null : destructuringTransform,
		[jsxTransform, {pragma: options.pragma, pragmaFrag: options.pragmaFrag, useBuiltIns: true}]
	].filter(Boolean);

	const result = babel.transformSync(source, {
		plugins,
		filename: modulePath,
		sourceMaps: 'inline',
		babelrc: false,
		configFile: false
	});

	return result.code;
};

module.exports = transform;
