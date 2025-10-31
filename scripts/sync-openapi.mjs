import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { get } from 'node:https';

const SPEC_URL = process.env.MAILRIFY_OPENAPI_URL ?? 'https://raw.githubusercontent.com/Mailrify/mailrify-openapi/main/openapi.yaml';
const DEST_PATH = resolve('openapi.yaml');
const VERSION_PATH = resolve('spec-version.json');

const extractVersion = (urlString) => {
  try {
    const { pathname } = new URL(urlString);
    const segments = pathname.split('/').filter(Boolean);
    // Example path: /Mailrify/mailrify-openapi/v1.0.0/openapi.yaml
    return segments[2] ?? 'main';
  } catch (error) {
    return 'unknown';
  }
};

mkdirSync(resolve('.'), { recursive: true });

const specVersion = process.env.MAILRIFY_OPENAPI_VERSION ?? extractVersion(SPEC_URL);

await new Promise((resolvePromise, rejectPromise) => {
  const request = get(SPEC_URL, (response) => {
    if (response.statusCode && response.statusCode >= 400) {
      rejectPromise(new Error(`Failed to download OpenAPI spec: HTTP ${response.statusCode}`));
      response.resume();
      return;
    }

    const fileStream = createWriteStream(DEST_PATH);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close(resolvePromise);
    });
    fileStream.on('error', rejectPromise);
  });

  request.on('error', rejectPromise);
});

writeFileSync(
  VERSION_PATH,
  JSON.stringify(
    {
      version: specVersion,
      source: SPEC_URL,
      fetchedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
