import { startServer } from './server.ts'
import config from '../config.json' assert {type:'json'};
startServer(config.server);

