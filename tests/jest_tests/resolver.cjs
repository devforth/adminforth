const fs = require('node:fs');
const path = require('node:path');

module.exports = (request, options) => {
  const isRelativeJavaScriptImport = (request.startsWith('./') || request.startsWith('../')) && request.endsWith('.js');

  if (isRelativeJavaScriptImport) {
    const requestedPath = path.resolve(options.basedir, request);

    if (!fs.existsSync(requestedPath)) {
      const typescriptPath = requestedPath.slice(0, -3) + '.ts';
      if (fs.existsSync(typescriptPath)) {
        return options.defaultResolver(typescriptPath, options);
      }
    }
  }

  return options.defaultResolver(request, options);
};