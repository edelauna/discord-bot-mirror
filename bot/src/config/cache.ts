import {Env} from 'discord-mirror-common/types/environment';
import {Cache} from '../svcs/cache';

export const getCacheSvs = (env: Env) => new Cache(env);
