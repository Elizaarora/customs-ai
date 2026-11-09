#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/60ea008825015582f1f9daa57e732ad92cce6f7890b38bea2d680016fb522ba1/contract';
import endContract from '../../snapshots/60ea008825015582f1f9daa57e732ad92cce6f7890b38bea2d680016fb522ba1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/73d15279d813001df7ded0c4b0cde70080d88002b4c96c9423a4ea90cff584bb/contract';
import startContract from '../../snapshots/73d15279d813001df7ded0c4b0cde70080d88002b4c96c9423a4ea90cff584bb/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'CheckResult', column: 'passed' }),
      this.createTable({
        schema: 'public',
        table: 'ExportLog',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rowCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('shipmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'CheckResult',
        column: col('resolutionNote', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'CheckResult',
        column: col('status', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'FieldEdit',
        column: col('lineItemId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'FieldEdit',
        column: col('type', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'LineItem',
        column: col('hsn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dropNotNull({ schema: 'public', table: 'FieldEdit', column: 'fieldId' }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'CheckResult',
        column: 'involvedFieldIds',
        type: 'int4[]',
        temporaryDefault: sql`'{}'`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'CheckResult',
        constraint: 'CheckResult_involvedFieldIds_elem_not_null_eeaa2953',
        expression: sql`array_position("involvedFieldIds", NULL) IS NULL`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'CheckResult',
        constraint: 'CheckResult_status_check_db7a8d10',
        expression: sql`"status" IN ('PASSED', 'FAILED', 'CANNOT_CHECK')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'FieldEdit',
        constraint: 'FieldEdit_type_check_c338ff2a',
        expression: sql`"type" IN ('EDIT', 'CONFIRM', 'OVERRIDE', 'MANUAL_ENTRY')`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'ExportLog',
        index: 'ExportLog_shipmentId_idx_e3606ec1',
        columns: ['shipmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ExportLog',
        index: 'ExportLog_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FieldEdit',
        index: 'FieldEdit_lineItemId_idx_9b768ec0',
        columns: ['lineItemId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ExportLog',
        foreignKey: {
          name: 'ExportLog_shipmentId_fkey',
          columns: ['shipmentId'],
          references: { schema: 'public', table: 'Shipment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ExportLog',
        foreignKey: {
          name: 'ExportLog_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FieldEdit',
        foreignKey: {
          name: 'FieldEdit_lineItemId_fkey',
          columns: ['lineItemId'],
          references: { schema: 'public', table: 'LineItem', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
