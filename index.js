import process from 'node:process';
import cachedTransform, {cacheKeyFromSource} from './cache.js';
import transform from './transform.js';

export const load = async (url, _context, nextLoad) => {
	if (!url.endsWith('.js') || url.includes('node_modules')) {
		return nextLoad(url);
	}

	const result = await nextLoad(url);

	if (!result.source) {
		return result;
	}

	const source = result.source.toString();

	const useCache =
		process.env.IMPORT_JSX_CACHE !== '0' &&
		process.env.IMPORT_JSX_CACHE !== 'false';

	const cacheKey = cacheKeyFromSource(source);

	try {
		const transformedSource = await cachedTransform(
			() => {
				return transform(source, url);
			},
			{
				enabled: useCache,
				key: cacheKey
			}
		);

		return {
			source: transformedSource,
			format: 'module',
			shortCircuit: true
		};
	} catch {
		return nextLoad(url);
	}
};
