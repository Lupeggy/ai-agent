import type { InferSelectModel } from 'drizzle-orm';
import type { meeting } from '@/db/schemas';

export type Meeting = InferSelectModel<typeof meeting>;
