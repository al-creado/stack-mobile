import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

const ABSOLUTE = 'https://www.indiancommodities.co.in/stackapi';

/** Relative '/stackapi' only works behind the dev proxy; native builds always use the absolute URL. */
export const API_BASE: string = Capacitor.isNativePlatform() ? ABSOLUTE : environment.apiUrl;
