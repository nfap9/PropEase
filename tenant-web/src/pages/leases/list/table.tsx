import type { TableProps } from 'antd';
import { Skeleton, Table } from 'antd';
import type { Lease } from '@/types';

interface LeasesTableProps {
  leases: Lease[] | undefined;
  loading: boolean;
  columns: TableProps<Lease>['columns'];
  selectedRowKeys: Record<string, boolean>;
  onSelectionChange: (keys: React.Key[]) => void;
}

export function LeasesTable({
  leases,
  loading,
  columns,
  selectedRowKeys,
  onSelectionChange,
}: LeasesTableProps) {
  const tableProps: TableProps<Lease> = {
    columns,
    dataSource: leases,
    rowKey: 'id',
    pagination: false,
    rowSelection: {
      type: 'radio',
      selectedRowKeys: Object.keys(selectedRowKeys),
      onChange: (keys) => {
        onSelectionChange(keys);
      },
    },
  };

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return <Table {...tableProps} />;
}
