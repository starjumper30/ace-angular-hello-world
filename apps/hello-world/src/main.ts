process.chdir(__dirname);
import * as fs from 'fs';

let count = 0;
const intervalId = setInterval(() => {
  fs.open('/home/hostDB.sqlite', 'r+', function (err, fd) {
    count++;
    if (err) {
      console.log('file error', err.code);
      if (count > 10) {
        clearInterval(intervalId);
      }
    } else {
      console.log('file available');
      clearInterval(intervalId);
      fs.close(fd, function () {
        console.log('file closed');
        start();
      });
    }
  });
}, 1000);

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

function start() {
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

  // Mount the static files directory
  const staticDir = path.join(__dirname, 'assets');
  app.use(express.static(staticDir));

  // Atlassian security policy requirements
  // http://go.atlassian.com/security-requirements-for-cloud-apps
  app.use(nocache());

  // Show nicer errors in dev mode
  if (devEnv) app.use(errorHandler());

  // Wire up routes
  routes(app);

  // Boot the HTTP server
  http.createServer(app).listen(port, () => {
    console.log('App server running at http://' + os.hostname() + ':' + port);

    // Enables auto registration/de-registration of app into a host in dev mode
    if (devEnv) addon.register();
  });
}
