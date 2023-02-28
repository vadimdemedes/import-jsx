// Based on https://github.com/babel/babel-loader/blob/15df92fafd58ec53ba88efa22de7b2cee5e65fcc/src/cache.js
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import makeDir from 'make-dir';
import findCacheDir from 'find-cache-dir';
import packageConfig from './package.json' assert {type: 'json'};

const cacheDirectory = findCacheDir({name: 'import-jsx'}) || os.tmpdir();

export const cacheKeyFromSource = source => {
	const contents = JSON.stringify({
		source,
		version: packageConfig.version
	});

	return crypto.createHash('md5').update(contents).digest('hex') + '.js';
};

const cachedTransform = async (
	transform,
	parameters,
	directory = cacheDirectory
) => {
	const {enabled, key} = parameters;

	if (!enabled) {
		return transform();
	}

	const file = path.join(directory, key);

	try {
		// No errors mean that the file was previously cached
		// we just need to return it
		return await fs.readFile(file, 'utf8');
	} catch {}

	const fallback = directory !== os.tmpdir();

	// Make sure the directory exists.
	try {
		await makeDir(directory);
	} catch (error) {
		if (fallback) {
			return cachedTransform(transform, parameters, os.tmpdir());
		}

		throw error;
	}

	// Otherwise just transform the file
	// return it to the user asap and write it in cache
	const result = await transform();

	try {
		await fs.writeFile(file, result);
	} catch (error) {
		if (fallback) {
			// Fallback to tmpdir if node_modules folder not writable
			return cachedTransform(transform, parameters, os.tmpdir());
		}

		throw error;
	}

	return result;
};

export default cachedTransform;
