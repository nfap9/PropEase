
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth';
import { invalidateOrgScopedQueries } from '@/hooks/query-utils';
import { Select, Modal, Button, message } from 'antd';
import { Building2, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Organization } from '@/types';

export function OrgSelector() {
  const { organization, organizations, setOrganization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingOrg, setPendingOrg] = useState<Organization | null>(null);

  const handleSelectOrg = (value: string) => {
    const org = organizations.find((o) => o.id.toString() === value);
    if (!org || org.id === organization?.id) return;
    setPendingOrg(org);
  };

  const handleConfirmSwitch = () => {
    if (pendingOrg) {
      setOrganization(pendingOrg);
      invalidateOrgScopedQueries(queryClient);
      setPendingOrg(null);
      navigate(0); // refresh current route
    }
  };

  const handleCancelSwitch = () => {
    setPendingOrg(null);
  };

  if (organizations.length === 0) {
    return (
      <Button onClick={() => navigate('/organizations/new')} className="gap-2">
        <Plus className="h-4 w-4" />
        创建团队
      </Button>
    );
  }

  return (
    <>
      <Select
        value={organization?.id?.toString() || ''}
        onChange={(value) => handleSelectOrg(value)}
        className="w-[200px]"
      >
        <Select.Option value="" disabled>
          <Building2 className="inline mr-2 h-4 w-4" />
          选择团队
        </Select.Option>
        {organizations.map((org) => (
          <Select.Option key={org.id} value={org.id.toString()}>
            {org.name}
          </Select.Option>
        ))}
        <Select.Option value="__manage__" onClick={() => navigate('/organizations')}>
          <Settings className="inline mr-2 h-4 w-4" />
          管理团队
        </Select.Option>
      </Select>

      <Modal
        open={!!pendingOrg}
        onCancel={handleCancelSwitch}
        title="确认切换团队"
        footer={[
          <Button key="cancel" onClick={handleCancelSwitch}>取消</Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmSwitch}>确认切换</Button>,
        ]}
      >
        <p>确定要切换到团队 "{pendingOrg?.name ?? ''}" 吗？切换后页面将刷新以加载新团队的数据。</p>
      </Modal>
    </>
  );
}
