import { env } from 'cloudflare:workers';
import {configure} from '@/lib/platform/server';
import {handler} from '@/lib/platform/handler';
configure(env as unknown as Parameters<typeof configure>[0]);
export const GET=handler;
export const POST=handler;
export const PATCH=handler;
export const DELETE=handler;
