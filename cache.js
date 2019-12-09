/**
 * Filesystem Cache
 *
 * Based on https://github.com/babel/babel-loader/blob/15df92fafd58ec53ba88efa22de7b2cee5e65fcc/src/cache.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const findCacheDir = require('find-cache-dir');
const transform = require('./transform');

let directory = null;

/**
 * Build the filename for the cached file
 *
 * @param  {String} source  Original contents of the file to be cached
 * @param  {Object} options Options passed to importJsx
 * @param  {String} version Version of import-jsx
 *
 * @return {String}
 */
const filename = (source, options, version) => {
	const hash = crypto.createHash('md4');

	const contents = JSON.stringify({source, options, version});

	hash.update(contents);

	return hash.digest('hex') + '.js';
};

/**
 * Handle the cache
 *
 * @params {String} directory
 * @params {Object} params
 */
const handleCache = (directory, params) => {
	const {
		modulePath,
		options,
		source,
		version
	} = params;

	const file = path.join(directory, filename(source, options, version));

	try {
		// No errors mean that the file was previously cached
		// we just need to return it
		return fs.readFileSync(file).toString();
	} catch (err) {}

	const fallback = directory !== os.tmpdir();

	// Make sure the directory exists.
	try {
		mkdirp.sync(directory);
	} catch (err) {
		if (fallback) {
			return handleCache(os.tmpdir(), params);
		}

		throw err;
	}

	// Otherwise just transform the file
	// return it to the user asap and write it in cache
	const result = transform(source, options, modulePath);

	try {
		fs.writeFileSync(file, result);
	} catch (err) {
		if (fallback) {
			// Fallback to tmpdir if node_modules folder not writable
			return handleCache(os.tmpdir(), params);
		}

		throw err;
	}

	return result;
};

/**
 * Retrieve file from cache, or create a new one for future reads
 *
 * @param  {Object}   params
 * @param  {String}   params.modulePath
 * @param  {String}   params.source     Original contents of the file to be cached
 * @param  {Object}   params.options    Options passed to importJsx
 * @param  {String}   params.version    Version of import-jsx
 */

module.exports = params => {
	if (directory === null) {
		directory =
			findCacheDir({name: 'import-jsx'}) || os.tmpdir();
	}

	return handleCache(directory, params);
};
