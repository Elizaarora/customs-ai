#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/73d15279d813001df7ded0c4b0cde70080d88002b4c96c9423a4ea90cff584bb/contract';
import endContract from '../../snapshots/73d15279d813001df7ded0c4b0cde70080d88002b4c96c9423a4ea90cff584bb/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Approval',
        columns: [
          col('approvedAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('approvedById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('shipmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CheckResult',
        columns: [
          col('checkName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('details', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('passed', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('resolvedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('resolvedById', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('shipmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Document',
        columns: [
          col('extractionError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('extractionStatus', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('filePath', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('shipmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('uploadedAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('uploadedById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Document_extractionStatus_check_eed2ebf7',
            sql`"extractionStatus" IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')`,
          ),
          checkExpression(
            'Document_type_check_dd21a735',
            sql`"type" IN ('INVOICE', 'PACKING_LIST', 'BILL_OF_LADING')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ExtractedField',
        columns: [
          col('confidence', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('documentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('AUTO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ExtractedField_status_check_187e2248',
            sql`"status" IN ('AUTO', 'NEEDS_REVIEW', 'CONFIRMED', 'MANUAL')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'FieldEdit',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fieldId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('newValue', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('oldValue', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'LineItem',
        columns: [
          col('confidence', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('documentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lineTotal', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('quantity', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('AUTO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('unitOfMeasure', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('unitPrice', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'LineItem_status_check_187e2248',
            sql`"status" IN ('AUTO', 'NEEDS_REVIEW', 'CONFIRMED', 'MANUAL')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Shipment',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Shipment_status_check_61785c97',
            sql`"status" IN ('DRAFT', 'IN_REVIEW', 'READY_FOR_APPROVAL', 'APPROVED', 'EXPORTED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('User_role_check_acf1c8ad', sql`"role" IN ('EXECUTIVE', 'MANAGER')`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Document',
        constraint: 'Document_shipmentId_type_key',
        columns: ['shipmentId', 'type'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ExtractedField',
        constraint: 'ExtractedField_documentId_name_key',
        columns: ['documentId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Shipment',
        constraint: 'Shipment_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Approval',
        index: 'Approval_approvedById_idx_01ef8410',
        columns: ['approvedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Approval',
        index: 'Approval_shipmentId_idx_e3606ec1',
        columns: ['shipmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CheckResult',
        index: 'CheckResult_resolvedById_idx_fc75edc7',
        columns: ['resolvedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CheckResult',
        index: 'CheckResult_shipmentId_idx_e3606ec1',
        columns: ['shipmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Document',
        index: 'Document_shipmentId_idx_e3606ec1',
        columns: ['shipmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Document',
        index: 'Document_uploadedById_idx_b92fad21',
        columns: ['uploadedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ExtractedField',
        index: 'ExtractedField_documentId_idx_825ef746',
        columns: ['documentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FieldEdit',
        index: 'FieldEdit_fieldId_idx_44d815d7',
        columns: ['fieldId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FieldEdit',
        index: 'FieldEdit_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'LineItem',
        index: 'LineItem_documentId_idx_825ef746',
        columns: ['documentId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Approval',
        foreignKey: {
          name: 'Approval_shipmentId_fkey',
          columns: ['shipmentId'],
          references: { schema: 'public', table: 'Shipment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Approval',
        foreignKey: {
          name: 'Approval_approvedById_fkey',
          columns: ['approvedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CheckResult',
        foreignKey: {
          name: 'CheckResult_shipmentId_fkey',
          columns: ['shipmentId'],
          references: { schema: 'public', table: 'Shipment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CheckResult',
        foreignKey: {
          name: 'CheckResult_resolvedById_fkey',
          columns: ['resolvedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Document',
        foreignKey: {
          name: 'Document_shipmentId_fkey',
          columns: ['shipmentId'],
          references: { schema: 'public', table: 'Shipment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Document',
        foreignKey: {
          name: 'Document_uploadedById_fkey',
          columns: ['uploadedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ExtractedField',
        foreignKey: {
          name: 'ExtractedField_documentId_fkey',
          columns: ['documentId'],
          references: { schema: 'public', table: 'Document', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FieldEdit',
        foreignKey: {
          name: 'FieldEdit_fieldId_fkey',
          columns: ['fieldId'],
          references: { schema: 'public', table: 'ExtractedField', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FieldEdit',
        foreignKey: {
          name: 'FieldEdit_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'LineItem',
        foreignKey: {
          name: 'LineItem_documentId_fkey',
          columns: ['documentId'],
          references: { schema: 'public', table: 'Document', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
