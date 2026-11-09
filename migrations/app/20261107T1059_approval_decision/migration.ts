#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5be27cc12f8f6c7182faed9daef7022f1168e8bbf8f9ea7994cd01d7fa6e3800/contract';
import endContract from '../../snapshots/5be27cc12f8f6c7182faed9daef7022f1168e8bbf8f9ea7994cd01d7fa6e3800/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/60ea008825015582f1f9daa57e732ad92cce6f7890b38bea2d680016fb522ba1/contract';
import startContract from '../../snapshots/60ea008825015582f1f9daa57e732ad92cce6f7890b38bea2d680016fb522ba1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Approval',
        column: col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Approval',
        column: col('decision', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Approval',
        constraint: 'Approval_decision_check_26ce66ff',
        expression: sql`"decision" IN ('APPROVED', 'SENT_BACK')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
