import { AddonRequest } from './services/endpoint.service';
import { isConfiguredHost, logHosts } from './services/environment.service';

process.chdir(__dirname);

// Entry point for the app
import { AddOnFactory } from 'atlassian-connect-express';

// Express is the underlying that atlassian-connect-express uses:
// https://expressjs.com
import * as express from 'express';

// https://expressjs.com/en/guide/using-middleware.html
import * as bodyParser from 'body-parser';
import compression = require('compression');
import cookieParser = require('cookie-parser');
import errorHandler = require('errorhandler');
import morgan = require('morgan');

// atlassian-connect-express also provides a middleware
import ace = require('atlassian-connect-express');

// We also need a few stock Node modules
import * as http from 'http';
import * as path from 'path';
import * as os from 'os';
import * as helmet from 'helmet';
import * as nocache from 'nocache';

// Routes live here; this is the C in MVC
import { routes } from './routes';

// Bootstrap Express and atlassian-connect-express
const app = express();
const addon = ((ace as unknown) as AddOnFactory)(app);

// See config.json
const port = addon.config.port();
app.set('port', port);

// Log requests, using an appropriate formatter by env
const devEnv = app.get('env') === 'development';
app.use(morgan(devEnv ? 'dev' : 'combined'));

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
// HSTS must be enabled with a minimum age of at least one year
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: false,
  })
);
app.use(
  helmet.referrerPolicy({
    policy: ['origin'],
  })
);

// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Gzip responses when appropriate
app.use(compression());

// Include atlassian-connect-express middleware
app.use(addon.middleware());

const authMiddleware = addon.authenticate(true);

// Prevent loading modules outside jira
app.use(
  '/module-*',
  (
    request: AddonRequest,
    response: express.Response,
    next: express.NextFunction
  ) => {
    if (
      request.originalUrl.endsWith('.js') ||
      request.originalUrl.endsWith('.css') ||
      request.originalUrl.startsWith('/module-hello-world/assets/')
    ) {
      // allow asset files loaded by angular. We're really just trying to block the index.html.
      request.next();
    } else {
      authMiddleware(request, response, next);
    }
  }
);

// Mount the static files directory
const staticDir = path.join(__dirname, 'assets');
app.use(express.static(staticDir));

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
app.use(nocache());

// Show nicer errors in dev mode
if (devEnv) app.use(errorHandler());

app.use(
  '/installed',
  (
    request: AddonRequest,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const host = request.body.baseUrl;
    console.log('INSTALLING HOST', host);
    if (isConfiguredHost(host)) {
      next();
    } else {
      const msg = `The originating JIRA Host '${host}' is not authorized for this addon`;
      console.log(msg);
      logHosts();
      response.status(403).send(msg);
    }
  }
);

app.use('/api/*', authMiddleware);
app.use(
  '/api/*',
  (
    request: AddonRequest,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const host = request.context.hostBaseUrl;
    console.debug('REQUEST FOR', host);
    if (isConfiguredHost(host)) {
      next();
    } else {
      response
        .status(403)
        .send(
          `The originating JIRA Host ${host} is not authorized for this addon`
        );
    }
  }
);

// Wire up routes
routes(app);

// Boot the HTTP server
http.createServer(app).listen(port, () => {
  console.log('App server running at http://' + os.hostname() + ':' + port);

  // Enables auto registration/de-registration of app into a host in dev mode
  if (devEnv) addon.register();
});
